import { Request, Response } from "express";
import admin from "../config/firebase";
import { v4 as uuidv4 } from "uuid";
import { Service, Item, Business, Category } from "../models/serviceModel";
import { Subscription } from "../models/subscriptionModel";
import { getDownloadURL } from "firebase-admin/storage";
import { Timestamp } from "firebase-admin/firestore";


const db = admin.firestore();
const storage = admin.storage();

// Helper function to calculate subscription end date
function calculateEndDate(startDate: Date, planType: 'monthly' | '6month' | 'yearly'): Date {
    const endDate = new Date(startDate);
    switch (planType) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case '6month':
            endDate.setMonth(endDate.getMonth() + 6);
            break;
        case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
    }
    return endDate;
}
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Services
//  Create Business
export const createBusiness = async (req: Request, res: Response) => {
    try {
        const { name, description, adminId } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name, description are required" });

        }

        const newBusiness: Business = {
            id: uuidv4(),
            name,
            description,
            rating: 0,
            reviewCount: 0,
            adminId: adminId || null,
            createdAt: Timestamp.fromDate(new Date()),
        };   
        await db.collection("business").doc(newBusiness.id).set(newBusiness);
        res.status(201).json({ message: "Business created successfully", newBusiness });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Business
export const getAllBusiness = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection("business").get();
        if (snapshot.empty) {
            return res.status(404).json({ message: "No business found for this admin" });
        }

        // Fetch businesses with subscription information
        const businesses: any[] = [];
        for (const doc of snapshot.docs) {
            const businessData: any = { id: doc.id, ...doc.data() };
            
            // If business has a subscriptionId, fetch subscription details
            if (businessData.subscriptionId) {
                try {
                    const subscriptionDoc = await db.collection("subscriptions").doc(businessData.subscriptionId).get();
                    if (subscriptionDoc.exists) {
                        const subscriptionData: any = subscriptionDoc.data();
                        businessData.subscription = {
                            id: subscriptionDoc.id,
                            ...subscriptionData
                        };
                    }
                } catch (subscriptionError) {
                    console.error(`Error fetching subscription for business ${doc.id}:`, subscriptionError);
                    // Continue without subscription data if there's an error
                }
            }
            
            businesses.push(businessData);
        }

        return res.status(200).json(businesses);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
// Get Business for specific Admin
export const getBusinessByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const adminRole = req.user?.role;

        if (adminRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized: Admin only" });
        }
        const snapshot = await db.collection("business").where("adminId", "==", adminId).limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: "No business found for this admin" });
        }
        const doc = snapshot.docs[0];
        const business = { id: doc.id, ...doc.data() };

        return res.status(200).json(business);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// Update Business by ID
export const updateBusiness= async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        await db.collection("business").doc(businessId).update(req.body);
        res.status(200).json({ message: "Business updated successfully", businessId: businessId });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// Delete Business
export const deleteBusiness = async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        await db.collection("business").doc(businessId).delete();
        res.status(200).json({ message: "Business deleted successfully", businessId: businessId })
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


//  Services
// Create Services

export const createService = async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });

        }

        const newService: Service = {
            id: uuidv4(),
            name,
            description,
            rating: 0,
            reviewCount: 0,
            createdAt: Timestamp.fromDate(new Date()),
        }

        await db.collection("business").doc(businessId).collection("services").doc(newService.id).set(newService);
        res.status(201).json({ message: "Service created successfully", newService });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// Get All Services

export const getServices = async (req: Request, res: Response) => {
    try {
        const { businessId } = req.params;
        const snapshot = await db.collection("business").doc(businessId).collection("services").get();
        const services = snapshot.docs.map((doc) => doc.data());

        res.status(200).json(services);
    } catch (error: any) {
        res.status(500).json({ error: error.message });

    }
};

// Update Service
export const updateService = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId } = req.params;
        await db.collection("business").doc(businessId).collection("services").doc(serviceId).update(req.body);
        res.status(200).json({ message: "Service updated successfully" })

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Service
export const deleteService = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId } = req.params;
        await db.collection("business").doc(businessId).collection("services").doc(serviceId).delete();
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Items
//  Add Items

export const addItem = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId } = req.params;
        const { name, description, price, category } = req.body;
        const image = req.file;

        let imageUrl = "";
        if (!name || !description || !price || !category) {
            return res.status(400).json({ error: "Name, description, price, and category are required" });
        }

        if (image) {
            const bucket = storage.bucket();
            const file = bucket.file(`items/${Date.now()}-${image.originalname}`);
            await file.save(image.buffer, { contentType: image.mimetype });
            imageUrl = await getDownloadURL(file)
        } else {
            // Generate a default image URL or use a placeholder
            imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
        }

        const newItem: Item = {
            id: uuidv4(),
            businessId,
            serviceId,
            name,
            description,
            price: parseFloat(price),
            imageUrl,
            category: category.toLowerCase(),
            rating: 0,
            reviewCount: 0,
            createdAt: Timestamp.fromDate(new Date()),
        }

        await db.collection("business").doc(businessId).collection("services").doc(serviceId).collection("items").doc(newItem.id).set(newItem);

        res.status(201).json({ message: "Item created successfully", newItem });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all items
export const getAllItems = async(req: Request, res: Response) => {
    try{
        const {businessId, serviceId} = req.params;
        const category = req.query.category as string;
        
        const itemsRef = db.collection("business").doc(businessId).collection("services").doc(serviceId).collection("items");

        const query = category ? itemsRef.where("category", "==", category.toLowerCase()): itemsRef;    

        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => doc.data());
        res.status(200).json(items);
    }catch(error: any){
        res.status(500).json({error: error.message});
}
};

//  Update Item

export const updateItem = async (req: Request, res: Response) => {
    try{
        const {businessId, serviceId, itemId} = req.params;
        const updated = req.body;
        const image = req.file;

        if (image) {
            const bucket = storage.bucket();
            const file = bucket.file(`items/${Date.now()}-${image.originalname}`);
            await file.save(image.buffer, { contentType: image.mimetype });
            updated.imageUrl = await getDownloadURL(file)
        }

        updated.price = parseFloat(updated.price);

        await db.
        collection("business").
        doc(businessId).
        collection("services").
        doc(serviceId).
        collection("items").
        doc(itemId).
        update(updated);

        res.status(200).json({message: "Item updated successfully"})
    }catch(error: any){
        res.status(500).json({error: error.message});
    }
};

// Delete Item

export const deleteItem = async( req: Request, res: Response) => {
    try{
        const {businessId, serviceId, itemId} = req.params;
        await db.collection("business").
        doc(businessId).
        collection("services").
        doc(serviceId).
        collection("items").
        doc(itemId).
        delete();


        res.status(200).json({message: "Item deleted successfully"});
    } catch(error: any){
        res.status(500).json({error: error.message});

    }
};

// Categories
//  Add Category
export const addCategory = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const newCategory: Category = {
            id: uuidv4(),
            businessId,
            serviceId,
            name: String(name).trim().toLowerCase(),
            createdAt: Timestamp.fromDate(new Date()),
        };

        await db
            .collection("business")
            .doc(businessId)
            .collection("services")
            .doc(serviceId)
            .collection("categories")
            .doc(newCategory.id)
            .set(newCategory);

        res.status(201).json({ message: "Category created successfully", newCategory });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId } = req.params;
        console.log(`[Categories] list -> businessId=${businessId} serviceId=${serviceId}`);
        const snapshot = await db
            .collection("business")
            .doc(businessId)
            .collection("services")
            .doc(serviceId)
            .collection("categories")
            .get();

        const categories = snapshot.docs.map((doc) => doc.data());
        console.log(`[Categories] found=${categories.length}`);
        res.status(200).json(categories);
    } catch (error: any) {
        console.error(`[Categories] error:`, error);
        res.status(500).json({ error: error.message });
    }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId, categoryId } = req.params;
        const updates: Partial<Pick<Category, "name">> = {};
        if (typeof req.body.name === "string") {
            updates.name = req.body.name.trim().toLowerCase();
        }

        await db
            .collection("business")
            .doc(businessId)
            .collection("services")
            .doc(serviceId)
            .collection("categories")
            .doc(categoryId)
            .update(updates);

        res.status(200).json({ message: "Category updated successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { businessId, serviceId, categoryId } = req.params;
        await db
            .collection("business")
            .doc(businessId)
            .collection("services")
            .doc(serviceId)
            .collection("categories")
            .doc(categoryId)
            .delete();

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
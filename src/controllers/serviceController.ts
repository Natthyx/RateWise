import { Request, Response } from "express";
import admin from "../config/firebase";
import { v4 as uuidv4 } from "uuid";
import { Service, Item, Business } from "../models/serviceModel";
import { getDownloadURL } from "firebase-admin/storage";


const db = admin.firestore();
const storage = admin.storage();
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
            createdAt: new Date(),
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

        const businesses =snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

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
            createdAt: new Date(),
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
        if (!name || !description || !price || !image || !category) {
            return res.status(400).json({ error: "Name, description, price, and image are required" });
        }

        if (image) {
            const bucket = storage.bucket();
            const file = bucket.file(`items/${Date.now()}-${image.originalname}`);
            await file.save(image.buffer, { contentType: image.mimetype });
            imageUrl = await getDownloadURL(file)
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
            createdAt: new Date(),
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


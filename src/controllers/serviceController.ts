import { Request, Response } from "express";
import admin from "../config/firebase";
import { v4 as uuidv4 } from "uuid";
import { Service, SubService, Item } from "../models/serviceModel";
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
//  Create Service
export const createService = async (req: Request, res: Response) => {
    try {
        const { name, description, adminId } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name, description are required" });

        }

        const newService: Service = {
            id: uuidv4(),
            name,
            description,
            rating: 0,
            reviewCount: 0,
            adminId: adminId || null,
            createdAt: new Date(),
        };
        await db.collection("services").doc(newService.id).set(newService);
        res.status(201).json({ message: "Service created successfully", newService });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Services
export const getAllServices = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection("services").get();
        if (snapshot.empty) {
            return res.status(404).json({ message: "No services found for this admin" });
        }

        const services =snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.status(200).json(services);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
export const getServiceByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const adminRole = req.user?.role;

        if (adminRole !== "admin") {
            return res.status(403).json({ error: "Unauthorized: Admin only" });
        }
        const snapshot = await db.collection("services").where("adminId", "==", adminId).limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: "No services found for this admin" });
        }
        const doc = snapshot.docs[0];
        const service = { id: doc.id, ...doc.data() };

        return res.status(200).json(service);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// Update Service
export const updateService = async (req: Request, res: Response) => {
    try {
        const { serviceId } = req.params;
        await db.collection("services").doc(serviceId).update(req.body);
        res.status(200).json({ message: "Service updated successfully", serviceId: serviceId });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// Delete Service
export const deleteService = async (req: Request, res: Response) => {
    try {
        const { serviceId } = req.params;
        await db.collection("services").doc(serviceId).delete();
        res.status(200).json({ message: "Service deleted successfully", serviceId: serviceId })
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


//  SubService
// Create SubService

export const createSubService = async (req: Request, res: Response) => {
    try {
        const { serviceId } = req.params;
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });

        }

        const newSubService: SubService = {
            id: uuidv4(),
            name,
            description,
            rating: 0,
            reviewCount: 0,
            createdAt: new Date(),
        }

        await db.collection("services").doc(serviceId).collection("subServices").doc(newSubService.id).set(newSubService);
        res.status(201).json({ message: "SubService created successfully", newSubService });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// Get All SubServices

export const getSubServices = async (req: Request, res: Response) => {
    try {
        const { serviceId } = req.params;
        const snapshot = await db.collection("services").doc(serviceId).collection("subServices").get();
        const subServices = snapshot.docs.map((doc) => doc.data());

        res.status(200).json(subServices);
    } catch (error: any) {
        res.status(500).json({ error: error.message });

    }
};

// Update SubService
export const updateSubService = async (req: Request, res: Response) => {
    try {
        const { serviceId, subServiceId } = req.params;
        await db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId).update(req.body);
        res.status(200).json({ message: "SubService updated successfully" })

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete SubService
export const deleteSubService = async (req: Request, res: Response) => {
    try {
        const { serviceId, subServiceId } = req.params;
        await db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId).delete();
        res.status(200).json({ message: "SubService deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Items
//  Add Items

export const addItem = async (req: Request, res: Response) => {
    try {
        const { serviceId, subServiceId } = req.params;
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
            serviceId,
            subServiceId,
            name,
            description,
            price: parseFloat(price),
            imageUrl,
            category: category.toLowerCase(),
            rating: 0,
            reviewCount: 0,
            createdAt: new Date(),
        }

        await db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId).collection("items").doc(newItem.id).set(newItem);

        res.status(201).json({ message: "Item created successfully", newItem });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all items
export const getAllItems = async(req: Request, res: Response) => {
    try{
        const {serviceId, subServiceId} = req.params;
        const category = req.query.category as string;
        
        const itemsRef = db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId).collection("items");

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
        const {serviceId, subServiceId, itemId} = req.params;
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
        collection("services").
        doc(serviceId).
        collection("subServices").
        doc(subServiceId).
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
        const {serviceId, subServiceId, itemId} = req.params;
        await db.collection("services").
        doc(serviceId).
        collection("subServices").
        doc(subServiceId).
        collection("items").
        doc(itemId).
        delete();


        res.status(200).json({message: "Item deleted successfully"});
    } catch(error: any){
        res.status(500).json({error: error.message});

    }
};


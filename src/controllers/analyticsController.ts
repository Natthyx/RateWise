import {Request , Response} from "express";
import admin from "../config/firebase";

const db = admin.firestore();

export const getTopStaffAnalytics = async (req: any, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const userRole = req.user?.role;
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }

        let staffSnap;
        
        if (userRole === "superadmin") {
            // Super Admin: Get ALL staff from ALL businesses
            staffSnap = await db.collection("staff").get();
        } else {
            // Regular Admin: Get the admin's business
            const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
            if (businessSnapshot.empty) {
                return res.status(404).json({ error: "Admin's business not found" });
            }
            const businessId = businessSnapshot.docs[0].id;
            
            // Get staff for this business only
            staffSnap = await db.collection("staff").where("businessId", "==", businessId).get();
        }

        // Get all staff IDs
        const staffIds = staffSnap.docs.map(doc => doc.id);
        
        // Fetch all sessions in parallel (much faster than sequential)
        const sessionPromises = staffIds.map(staffId =>
            db.collection("sessions")
                .where("staffId", "==", staffId)
                .where("rated", "==", true)
                .get()
                .catch(err => {
                    console.error(`Error fetching sessions for staff ${staffId}:`, err);
                    return { docs: [] };
                })
        );
        
        const sessionResults = await Promise.all(sessionPromises);
        
        // Build staff list with reviews
        const staffList = staffSnap.docs.map((doc, index) => {
            const staff = doc.data();
            const staffId = doc.id;
            const sessionSnap = sessionResults[index];

            const reviews = sessionSnap.docs.map(s => {
                const r = s.data().ratings;
                return {
                    comment: r.comment || "",
                    staffRating: r.staff || null,
                    timestamp: s.createTime,
                };
            });

            return {
                staffId,
                name: staff.name,
                rating: staff.rating || 0,
                reviewCount: staff.reviewCount || 0,
                reviews,
            };
        });

        const sorted = staffList.sort((a, b) =>
            b.rating === a.rating ? b.reviewCount - a.reviewCount : b.rating - a.rating);

        res.status(200).json({ topStaff: sorted });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


export const getTopBusinessAnalytics = async (req: Request , res : Response ) =>{
    try{
        const businessSnap = await db.collection("business").get();
        
        // Get all staff first
        const allStaffSnap = await db.collection("staff").get();
        const staffIds = allStaffSnap.docs.map(doc => doc.id);
        
        // Then get sessions for these staff members
        const sessionPromises = staffIds.map(staffId => 
            db.collection("sessions").where("staffId", "==", staffId).where("rated", "==", true).get()
        );
        
        const sessionSnaps = await Promise.all(sessionPromises);
        const sessionsSnap = {
            docs: sessionSnaps.flatMap(snap => snap.docs)
        };

        const businessMap: Record<string, any> = {};

        sessionsSnap.docs.forEach((doc) => {
            const session = doc.data();
            for (const ir of session.ratings?.itemRatings || []){
                if(!businessMap[ir.businessId]) businessMap[ir.businessId] = [];
                businessMap[ir.businessId].push({
                    comment: session.ratings.comment,
                    rating: ir.rating,
                });
            }
        });

        const businesses = businessSnap.docs.map((s) =>{
            const data = s.data();
            const reviews = businessMap[s.id] || [];
            return {
                serviceId: s.id,
                name: data.name,
                rating: data.rating || 0,
                reviewCount: data.reviewCount || 0,
                reviews,
            }; 
        });

        const sorted = businesses.sort((a,b) => 
            b.rating == a.rating 
            ? b.reviewCount - a.reviewCount : b.rating - a.rating);

            res.status(200).json({topBusiness: sorted})
    }

    catch(error: any){res.status(500).json({error: error.message});}
};

export const getTopServicesAnalytics = async (req: any, res: Response) => {
    try {
        const adminId = req.user?.userId;
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }

        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        if (businessSnapshot.empty) {
            return res.status(404).json({ error: "Admin's business not found" });
        }

        const businessId = businessSnapshot.docs[0].id;

        // Get sessions for this business only
        // First get all staff for this business
        const staffSnap = await db.collection("staff").where("businessId", "==", businessId).get();
        const staffIds = staffSnap.docs.map(doc => doc.id);
        
        // Then get sessions for these staff members
        const sessionPromises = staffIds.map(staffId => 
            db.collection("sessions").where("staffId", "==", staffId).where("rated", "==", true).get()
        );
        
        const sessionSnaps = await Promise.all(sessionPromises);
        const sessionSnap = {
            docs: sessionSnaps.flatMap(snap => snap.docs)
        };

        const serviceMap: Record<string, any> = {};

        sessionSnap.docs.forEach((doc) => {
            const session = doc.data();

            for (const ir of session.ratings?.itemRatings || []) {
                // Only include ratings for this business
                if (ir.businessId === businessId) {
                    const key = `${ir.businessId}:${ir.serviceId}`;
                    if (!serviceMap[key]) serviceMap[key] = [];
                    serviceMap[key].push({
                        comment: session.ratings.comment,
                        rating: ir.rating,
                    });
                }
            }
        });

        const allServices: any[] = [];

        // Get services for this business only
        const subSnap = await db.collection("business").doc(businessId).collection("services").get();

        subSnap.forEach((subDoc) => {
            const key = `${businessId}:${subDoc.id}`;
            const data = subDoc.data();

            const reviews = serviceMap[key] || [];

            allServices.push({
                serviceId: subDoc.id,
                businessId: businessId,
                name: data.name,
                rating: data.rating || 0,
                reviewCount: data.reviewCount || 0,
                reviews
            });
        });

        const sorted = allServices.sort((a, b) =>
            b.rating === a.rating
                ? b.reviewCount - a.reviewCount
                : b.rating - a.rating
        );

        res.status(200).json({ topServices: sorted });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTopItemsAnalytics = async (req: any, res: Response) => {
    try {
        const adminId = req.user?.userId;
        const userRole = req.user?.role;
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }

        let businessId: string;
        
        if (userRole === "superadmin") {
            // Super Admin: Get ALL items from ALL businesses
            const businessSnap = await db.collection("business").get();
            
            // Get all staff first
            const allStaffSnap = await db.collection("staff").get();
            const staffIds = allStaffSnap.docs.map(doc => doc.id);
            
            // Then get sessions for these staff members
            const sessionPromises = staffIds.map(staffId => 
                db.collection("sessions").where("staffId", "==", staffId).where("rated", "==", true).get()
            );
            
            const sessionSnaps = await Promise.all(sessionPromises);
            const sessionsSnap = {
                docs: sessionSnaps.flatMap(snap => snap.docs)
            };

            const itemMap: Record<string, any> = {};

            sessionsSnap.docs.forEach((doc) => {
                const session = doc.data();
                for (const ir of session.ratings?.itemRatings || []) {
                    const key = `${ir.businessId}:${ir.serviceId}:${ir.itemId}`;
                    if (!itemMap[key]) itemMap[key] = [];
                    itemMap[key].push({
                        comment: session.ratings.comment,
                        rating: ir.rating,
                    });
                }
            });

            const allItems: any[] = [];

            for (const businessDoc of businessSnap.docs) {
                const subSnap = await db.collection("business").doc(businessDoc.id).collection("services").get();

                for (const subDoc of subSnap.docs) {
                    const itemSnap = await db.collection("business").doc(businessDoc.id).collection("services").doc(subDoc.id).collection("items").get();

                    itemSnap.forEach((itemDoc) => {
                        const key = `${businessDoc.id}:${subDoc.id}:${itemDoc.id}`;
                        const data = itemDoc.data();
                        const reviews = itemMap[key] || [];

                        allItems.push({
                            itemId: itemDoc.id,
                            serviceId: subDoc.id,
                            businessId: businessDoc.id,
                            name: data.name,
                            rating: data.rating || 0,
                            reviewCount: data.reviewCount || 0,
                            reviews,
                        });
                    });
                }
            }

            const sorted = allItems.sort((a: any, b: any) =>
                b.rating === a.rating
                    ? b.reviewCount - a.reviewCount
                    : b.rating - a.rating
            );

            res.status(200).json({ topItems: sorted });
        } else {
            // Regular Admin: Get the admin's business
            const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
            if (businessSnapshot.empty) {
                return res.status(404).json({ error: "Admin's business not found" });
            }
            businessId = businessSnapshot.docs[0].id;

            // Get sessions for this business only
            // First get all staff for this business
            const staffSnap = await db.collection("staff").where("businessId", "==", businessId).get();
            const staffIds = staffSnap.docs.map(doc => doc.id);
            
            // Then get sessions for these staff members
            const sessionPromises = staffIds.map(staffId => 
                db.collection("sessions").where("staffId", "==", staffId).where("rated", "==", true).get()
            );
            
            const sessionSnaps = await Promise.all(sessionPromises);
            const sessionsSnap = {
                docs: sessionSnaps.flatMap(snap => snap.docs)
            };

            const itemMap: Record<string, any> = {};

            sessionsSnap.docs.forEach((doc) => {
                const session = doc.data();
                for (const ir of session.ratings?.itemRatings || []) {
                    // Only include ratings for this business
                    if (ir.businessId === businessId) {
                        const key = `${ir.businessId}:${ir.serviceId}:${ir.itemId}`;
                        if (!itemMap[key]) itemMap[key] = [];
                        itemMap[key].push({
                            comment: session.ratings.comment,
                            rating: ir.rating,
                        });
                    }
                }
            });

            const allItems: any[] = [];

            // Get services for this business only
            const subSnap = await db.collection("business").doc(businessId).collection("services").get();

            for (const subDoc of subSnap.docs) {
                const itemSnap = await db.collection("business").doc(businessId).collection("services").doc(subDoc.id).collection("items").get();

                itemSnap.forEach((itemDoc) => {
                    const key = `${businessId}:${subDoc.id}:${itemDoc.id}`;
                    const data = itemDoc.data();
                    const reviews = itemMap[key] || [];

                    allItems.push({
                        itemId: itemDoc.id,
                        serviceId: subDoc.id,
                        businessId: businessId,
                        name: data.name,
                        rating: data.rating || 0,
                        reviewCount: data.reviewCount || 0,
                        reviews,
                    });
                });
            }

            const sorted = allItems.sort((a: any, b: any) =>
                b.rating === a.rating
                    ? b.reviewCount - a.reviewCount
                    : b.rating - a.rating
            );

            res.status(200).json({ topItems: sorted });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

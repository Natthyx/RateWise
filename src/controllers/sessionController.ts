import {Request , Response} from "express";
import admin from "../config/firebase";
import { Session } from "../models/sessionModel";
import {v4 as uuidv4} from "uuid";

const db = admin.firestore();
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Create Session
export const createSession = async (req: AuthenticatedRequest, res: Response) =>{
    try{
        const staffId = req.user?.userId;
        const {items, totalAmount} = req.body;
        if (!staffId) {
            return res.status(401).json({ message: "Unauthorized: no staff ID found" });
        }
        if(!items || !totalAmount){
            return res.status(400).json({error: "Items and total amount are required"});
        }

        const newSession: Session = {
            id: uuidv4(),
            staffId: staffId,
            items,
            totalAmount,
            rated: false,
            verified: false,
            createdAt: new Date(),
        };
        
        await db.collection("sessions").doc(newSession.id).set(newSession);
        res.status(201).json({message:"New Session Created", newSession})
    } catch(error : any){
        res.status(500).json({error: error.message});
    }
};

// Get all sessions for a specific staff

export const getStaffSessions = async (req: AuthenticatedRequest, res: Response) =>{
    try{
        const {staffId} = req.params;
        if (!staffId) {
            return res.status(401).json({ message: "Unauthorized: no staff ID found" });
        }
        const snapshot = await db.collection("sessions").where("staffId","==",staffId).orderBy("createdAt", "desc").get();
        const sessions = snapshot.docs.map(doc => doc.data());

        res.status(200).json(sessions)
    } catch(error : any){
        res.status(500).json({error: error.message});
    }
};

// Get a specific session by ID

export const getSessionById = async(req: AuthenticatedRequest, res: Response) => {
    try{
        const staffId = req.user?.userId;
        if (!staffId) {
            return res.status(401).json({ message: "Unauthorized: no staff ID found" });
        }
        const { sessionId } = req.params;

        const session = await db.collection("sessions").doc(sessionId).get();

        if (!session.exists){
            return res.status(404).json({error: "session not found"})
        }
        if (session.data()?.staffId !== staffId){
            return res.status(404).json({error: "Unauthorized"})

        }

        res.status(200).json(session.data());
    } catch(error: any){
        res.status(500).json({error: error.message});
    }
};

// Rate a session
export const rateSession = async (req: Request, res: Response) => {
    try{
        const {sessionId} = req.params;
        const {staffRating, comment, itemRatings} = req.body;

        // Validate Input

        if(!staffRating && (!itemRatings || itemRatings.length === 0)){
            return res.status(400).json({error: "At least one rating is required"});
        }

        const sessionRef = db.collection("sessions").doc(sessionId);
        const sessionSnap = await sessionRef.get();

        if(!sessionSnap.exists){
            return res.status(404).json({error: "Session not found"});
        }

        const sessionData = sessionSnap.data() as Session;

        if(!sessionData) return res.status(400).json({error:"Invalid session data"});

        if(sessionData.rated){
            return res.status(400).json({error:"Session already rated"});
        }

        //  Update staff rating
        if(staffRating){
            const staffRef = db.collection("staff").doc(sessionData.staffId);
            const staffSnap = await staffRef.get();

            if(staffSnap.exists){
                const data = staffSnap.data()!;
                const newReviewCount = (data.reviewCount || 0)+ 1;
                const newRating = ((data.rating || 0) * (data.reviewCount || 0) + staffRating ) / newReviewCount;

                await staffRef.update({
                    rating: newRating,
                    reviewCount: newReviewCount
                });
            }
        }

        // Track Affected Subservice/Services

        const updatedSubServices = new Set<string>();
        const updatedServices = new Set<string>();

        // Update each Item's Rating (loop)
        for (const item of itemRatings || []){
            const {serviceId, subServiceId, itemId , rating} = item;

            const itemRef = db.collection('services').doc(serviceId).collection('subServices').doc(subServiceId).collection('items').doc(itemId);
            
            const itemSnap = await itemRef.get();
            if (!itemSnap.exists) continue;

            const data = itemSnap.data()!;
            const newReviewCount = (data.reviewCount || 0) + 1;
            const newRating = ((data.rating || 0) * (data.reviewCount || 0) + rating) / newReviewCount;

            await itemRef.update({
                rating: newRating,
                reviewCount: newReviewCount
            });

            // Track affected IDs
            updatedServices.add(serviceId);
            updatedSubServices.add(`${serviceId}:${subServiceId}`);
        }

        // Recalculate Affected Subservices

        for (const pair of updatedSubServices){
            const [serviceId, subServiceId] = pair.split(":");

            const itemsSnap = await db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId).collection("items").get();

            let totalRating = 0;
            let count = 0;

            itemsSnap.forEach((itemDoc) => {
                const itemData = itemDoc.data();
                if(itemData.rating !== undefined && itemData.reviewCount > 0){
                    totalRating += itemData.rating;
                    count++;
                }
            });

            const avg = count >0 ? totalRating / count : 0;

            const subServicRef = db.collection("services").doc(serviceId).collection("subServices").doc(subServiceId);

            await subServicRef.update({
                rating: avg,
                reviewCount: count,
            });
        }

        for (const serviceId of updatedServices){
            const subServiceSnap = await db.collection("services").doc(serviceId).collection("subServices").get();

            let totalRating = 0;
            let count = 0;

            subServiceSnap.forEach((subDoc) =>{
                const subData = subDoc.data();
                if(subData.rating !== undefined && subData.reviewCount > 0){
                    totalRating += subData.rating;
                    count++;
                }
            });

            const avg = count > 0 ? totalRating / count : 0;

            const serviceRef = db.collection("services").doc(serviceId);

            await serviceRef.update({
                rating: avg,
                reviewCount: count,
            });
        }

        // Mark Session as Rated
        await sessionRef.update({
            rated: true,
            ratings: {
                staff: staffRating,
                comment,
                itemRatings,
            }
        });

        return res.status(200).json({
            success: true,
            message: "Rating submitted successfully",
            sessionId,
            ratings: { staffRating, comment, itemRatings },
        });
    } catch(error: any){
        res.status(500).json({error: error.message});
    }
};


export const verifySessionRating = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionRef = db.collection("sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    await sessionRef.update({
      verified: true,
      verifiedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Session rating verified by admin",
      sessionId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

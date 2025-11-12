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
        
        console.log('📦 Creating session with items:', JSON.stringify(items, null, 2));
        console.log('🖼️  First item image check:', items[0]?.image ? 'HAS IMAGE' : 'NO IMAGE');
        if (items[0]?.image) {
            console.log('🖼️  Image URL:', items[0].image);
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
        console.log('✅ Session created with ID:', newSession.id);
        res.status(201).json({message:"New Session Created", newSession})
    } catch(error : any){
        console.log('💥 Create session error:', error.message);
        res.status(500).json({error: error.message});
    }
};

// Get all sessions for a specific staff

export const getStaffSessions = async (req: AuthenticatedRequest, res: Response) =>{
    try{
        const {staffId} = req.params;
        console.log('📊 Getting sessions for staff:', staffId);
        
        if (!staffId) {
            console.log('❌ No staff ID provided');
            return res.status(401).json({ message: "Unauthorized: no staff ID found" });
        }
        const snapshot = await db.collection("sessions").where("staffId","==",staffId).orderBy("createdAt", "desc").get();
        
        console.log(`📋 Found ${snapshot.docs.length} sessions for staff`);
        
        // Get staff info once to include in all sessions
        const staffDoc = await db.collection("staff").doc(staffId).get();
        const staffData = staffDoc.exists ? staffDoc.data() : null;
        
        console.log('👤 Staff data:', staffData ? `${staffData.name} (${staffData.avatar ? 'has avatar' : 'no avatar'})` : 'not found');
        if (staffData?.avatar) {
            console.log('🖼️  Staff avatar URL:', staffData.avatar);
        }
        
        const sessions = snapshot.docs.map(doc => {
            const sessionData = doc.data();
            
            // Log item data to debug images
            if (sessionData.items && sessionData.items.length > 0) {
                console.log('📦 First item in session:', JSON.stringify(sessionData.items[0], null, 2));
                console.log('🖼️  Item has image?', sessionData.items[0].image ? 'YES' : 'NO');
                if (sessionData.items[0].image) {
                    console.log('🖼️  Item image URL:', sessionData.items[0].image);
                }
            }
            
            return {
                ...sessionData,
                staffName: staffData?.name,
                staffAvatar: staffData?.avatar,
            };
        });

        console.log('✅ Returning sessions with staff info');
        res.status(200).json(sessions)
    } catch(error : any){
        console.log('💥 Get sessions error:', error.message);
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

        const updatedServices = new Set<string>();
        const updatedBusiness = new Set<string>();

        // Update each Item's Rating (loop)
        for (const item of itemRatings || []){
            const {businessId, serviceId, itemId , rating} = item;

            // Validate required fields
            if (!businessId || !serviceId || !itemId || !rating) {
                console.error('⚠️ Invalid item rating data:', { businessId, serviceId, itemId, rating });
                console.error('⚠️ Full item object:', JSON.stringify(item, null, 2));
                continue;
            }

            console.log(`📝 Updating item rating: businessId=${businessId}, serviceId=${serviceId}, itemId=${itemId}, rating=${rating}`);

            const itemRef = db.collection('business').doc(businessId).collection('services').doc(serviceId).collection('items').doc(itemId);
            
            const itemSnap = await itemRef.get();
            if (!itemSnap.exists) {
                console.error(`❌ Item not found: businessId=${businessId}, serviceId=${serviceId}, itemId=${itemId}`);
                continue;
            }

            const data = itemSnap.data()!;
            const oldRating = data.rating || 0;
            const oldReviewCount = data.reviewCount || 0;
            const newReviewCount = oldReviewCount + 1;
            const newRating = ((oldRating * oldReviewCount) + rating) / newReviewCount;

            console.log(`✅ Updating item: oldRating=${oldRating}, oldReviewCount=${oldReviewCount}, newRating=${newRating.toFixed(2)}, newReviewCount=${newReviewCount}`);

            await itemRef.update({
                rating: newRating,
                reviewCount: newReviewCount
            });

            // Track affected IDs
            updatedBusiness.add(businessId);
            updatedServices.add(`${businessId}:${serviceId}`);
        }

        // Recalculate Affected Subservices

        for (const pair of updatedServices){
            const [businessId, serviceId] = pair.split(":");

            const itemsSnap = await db.collection("business").doc(businessId).collection("services").doc(serviceId).collection("items").get();

            let totalWeightedRating = 0;
            let totalReviewCount = 0;

            itemsSnap.forEach((itemDoc) => {
                const itemData = itemDoc.data();
                const itemRating = itemData.rating || 0;
                const itemReviewCount = itemData.reviewCount || 0;
                
                if(itemRating !== undefined && itemReviewCount > 0){
                    // Weight the rating by the number of reviews
                    totalWeightedRating += itemRating * itemReviewCount;
                    totalReviewCount += itemReviewCount;
                }
            });

            // Calculate weighted average rating
            const avg = totalReviewCount > 0 ? totalWeightedRating / totalReviewCount : 0;

            const serviceRef = db.collection("business").doc(businessId).collection("services").doc(serviceId);

            await serviceRef.update({
                rating: avg,
                reviewCount: totalReviewCount,
            });
        }

        for (const businessId of updatedBusiness){
            const serviceSnap = await db.collection("business").doc(businessId).collection("services").get();

            let totalWeightedRating = 0;
            let totalReviewCount = 0;

            serviceSnap.forEach((subDoc) =>{
                const subData = subDoc.data();
                const serviceRating = subData.rating || 0;
                const serviceReviewCount = subData.reviewCount || 0;
                
                if(serviceRating !== undefined && serviceReviewCount > 0){
                    // Weight the rating by the number of reviews
                    totalWeightedRating += serviceRating * serviceReviewCount;
                    totalReviewCount += serviceReviewCount;
                }
            });

            // Calculate weighted average rating
            const avg = totalReviewCount > 0 ? totalWeightedRating / totalReviewCount : 0;

            const serviceRef = db.collection("business").doc(businessId);

            await serviceRef.update({
                rating: avg,
                reviewCount: totalReviewCount,
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

// Get recent sessions for admin's business
export const getRecentSessions = async (req: any, res: Response) => {
    try {
        const adminId = req.user?.userId;
        
        console.log('📊 Getting recent sessions for admin:', adminId);
        
        if (!adminId) {
            return res.status(401).json({ error: "Admin authentication required" });
        }

        // Get the admin's business
        const businessSnapshot = await db.collection("business").where("adminId", "==", adminId).get();
        if (businessSnapshot.empty) {
            console.log('❌ Business not found for admin:', adminId);
            return res.status(404).json({ error: "Admin's business not found" });
        }

        const businessId = businessSnapshot.docs[0].id;
        console.log('🏢 Business ID:', businessId);

        // Get all staff for this business to include names later
        const staffSnapshot = await db.collection("staff").where("businessId", "==", businessId).get();
        const staffMap = new Map();
        staffSnapshot.docs.forEach(doc => {
            staffMap.set(doc.id, {
                name: doc.data().name,
                avatar: doc.data().avatar
            });
        });

        console.log(`👥 Found ${staffSnapshot.docs.length} staff members`);
        
        // Build a fast lookup for staff IDs
        const staffIds = new Set(Array.from(staffMap.keys()));

        console.log(`🔍 Fetching recent sessions globally, then filtering by staff and rating`);

        // Fetch most recent sessions globally to avoid composite index requirements
        // Single-field index on createdAt is sufficient
        const recentSnap = await db
            .collection("sessions")
            .orderBy("createdAt", "desc")
            .limit(200)
            .get();

        let allSessions: any[] = [];
        recentSnap.docs.forEach(doc => {
            const data = doc.data();
            // Keep only sessions from this admin's staff and that are rated
            if (staffIds.has(data.staffId) && data.rated === true && data.ratings) {
                const session = {
                    id: doc.id,
                    staffId: data.staffId,
                    staffName: staffMap.get(data.staffId)?.name || 'Unknown Staff',
                    staffAvatar: staffMap.get(data.staffId)?.avatar,
                    ratings: data.ratings,
                    rated: data.rated === true,
                    createdAt: data.createdAt,
                    items: data.items || [],
                    totalAmount: data.totalAmount || 0,
                };
                allSessions.push(session);
            }
        });

        // Sort by creation time and limit to 10
        allSessions.sort((a, b) => {
            const aTime = a.createdAt?._seconds || 0;
            const bTime = b.createdAt?._seconds || 0;
            return bTime - aTime;
        });

        const recentSessions = allSessions.slice(0, 10);
        
        console.log(`✅ Returning ${recentSessions.length} recent sessions`);
        console.log(`📝 Sample session (if any): ${recentSessions.length > 0 ? JSON.stringify(recentSessions[0], null, 2) : 'none'}`);

        res.status(200).json({ recentSessions });
    } catch (error: any) {
        console.log('💥 Recent sessions error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get all reviews (rated sessions) for admin's business
export const getAllReviewsForAdmin = async (req: any, res: Response) => {
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

        // Get all staff for this business
        const staffSnapshot = await db.collection("staff").where("businessId", "==", businessId).get();
        const staffMap = new Map();
        staffSnapshot.docs.forEach(doc => {
            staffMap.set(doc.id, {
                name: doc.data().name,
                avatar: doc.data().avatar
            });
        });

        const staffIds = new Set(Array.from(staffMap.keys()));

        // Fetch recent rated sessions globally and filter
        const recentSnap = await db
            .collection("sessions")
            .orderBy("createdAt", "desc")
            .limit(500)
            .get();

        const reviews: any[] = [];
        recentSnap.docs.forEach(doc => {
            const data: any = doc.data();
            if (staffIds.has(data.staffId) && data.rated === true && data.ratings) {
                reviews.push({
                    id: doc.id,
                    staffId: data.staffId,
                    staffName: staffMap.get(data.staffId)?.name || 'Unknown Staff',
                    staffAvatar: staffMap.get(data.staffId)?.avatar,
                    comment: data.ratings?.comment || '',
                    staffRating: data.ratings?.staff || 0,
                    itemRatings: data.ratings?.itemRatings || [],
                    items: data.items || [],
                    totalAmount: data.totalAmount || 0,
                    createdAt: data.createdAt,
                });
            }
        });

        res.status(200).json({ reviews });
    } catch (error: any) {
        console.log('💥 Get all reviews error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
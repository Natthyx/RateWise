import {Request , Response} from "express";
import admin from "../config/firebase";

const db = admin.firestore();

export const getTopStaffAnalytics = async (req: Request , res : Response ) =>{
    try{
        const staffSnap = await db.collection("staff").get();


        const staffList = [];

        for(const doc of staffSnap.docs){
            const staff = doc.data();
            const staffId = doc.id;

            // Fetch all comments from sessions related to this stafff
            const sessionSnap = await db.collection("sessions").where("staffId","==",staffId).where("rated", "==", true).get();

            const reviews = sessionSnap.docs.map(s =>{
                const r = s.data().ratings;
                return {
                    comment: r.comment || "",
                    staffRating: r.staff || null,
                    timestamp: s.createTime,
                };
            });

            staffList.push({
                staffId,
                name: staff.name,
                rating: staff.rating || 0,
                reviewCount: staff.reviewCount || 0,
                reviews,
            });
        }

        const sorted = staffList.sort((a,b) =>
        b.rating === a.rating ? b.reviewCount - a.reviewCount : b.rating - a.rating);

        res.status(200).json({topStaff: sorted});
    }catch(error: any){
        res.status(500).json({error: error.message});
    }
};


export const getTopBusinessAnalytics = async (req: Request , res : Response ) =>{
    try{
        const businessSnap = await db.collection("business").get();
        const sessionsSnap = await db.collection("sessions").where("rated", "==", true).get();

        const businessMap: Record<string, any> = {};

        sessionsSnap.forEach((doc) => {
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

export const getTopServicesAnalytics = async (req: Request, res: Response) =>{
    try{
        const businessSnap = await db.collection("business").get();
        const sessionSnap = await db.collection("sessions").where("rated","==",true).get();


        const serviceMap: Record <string, any> = {};

        sessionSnap.forEach((doc) => {
            const session = doc.data();

            for(const ir of session.ratings?.itemRatings || []){
                const key = `${ir.businessId}:${ir.serviceId}`;
                if(!serviceMap[key]) serviceMap[key] = [];
                serviceMap[key].push({
                    comment: session.ratings.comment,
                    rating: ir.rating,
                });
            }
        });

        const allServices: any [] = [];

        for(const businessDoc of businessSnap.docs){
            const subSnap = await db.collection("business").doc(businessDoc.id).collection("services").get();

            subSnap.forEach((subDoc) => {
                const key = `${businessDoc.id}:${subDoc.id}`;
                const data = subDoc.data();

                const reviews = serviceMap[key] || [];

                allServices.push({
                    serviceId: subDoc.id,
                    businessId: businessDoc.id,
                    name: data.name,
                    rating: data.rating || 0,
                    reviewCount: data.reviewCount || 0,
                    reviews
                });
            });

        }

        const sorted = allServices.sort((a, b) =>
            b.rating === a.rating
            ? b.reviewCount - a.reviewCount
                : b.rating - a.rating
        );

        res.status(200).json({topServices: sorted})
    }catch(error: any){
        res.status(500).json({error: error.message});
    }
}


export const getTopItemsAnalytics = async (req: Request, res: Response) => {
  try {
    const businessSnap = await db.collection("business").get();
    const sessionsSnap = await db.collection("sessions").where("rated", "==", true).get();

    const itemMap: Record<string, any> = {};

    sessionsSnap.forEach((doc) => {
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
      const subSnap = await db
        .collection("business")
        .doc(businessDoc.id)
        .collection("services")
        .get();

      for (const subDoc of subSnap.docs) {
        const itemSnap = await db
          .collection("business")
          .doc(businessDoc.id)
          .collection("services")
          .doc(subDoc.id)
          .collection("items")
          .get();

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

    const sorted = allItems.sort((a, b) =>
      b.rating === a.rating
        ? b.reviewCount - a.reviewCount
        : b.rating - a.rating
    );

    res.status(200).json({ topItems: sorted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};




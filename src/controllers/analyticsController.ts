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


export const getTopServicesAnalytics = async (req: Request , res : Response ) =>{
    try{
        const serviceSnap = await db.collection("services").get();
        const sessionsSnap = await db.collection("sessions").where("rated", "==", true).get();

        const serviceMap: Record<string, any> = {};

        sessionsSnap.forEach((doc) => {
            const session = doc.data();
            for (const ir of session.ratings?.itemRatings || []){
                if(!serviceMap[ir.serviceId]) serviceMap[ir.serviceId] = [];
                serviceMap[ir.serviceId].push({
                    comment: session.ratings.comment,
                    rating: ir.rating,
                });
            }
        });

        const services = serviceSnap.docs.map((s) =>{
            const data = s.data();
            const reviews = serviceMap[s.id] || [];
            return {
                serviceId: s.id,
                name: data.name,
                rating: data.rating || 0,
                reviewCount: data.reviewCount || 0,
                reviews,
            }; 
        });

        const sorted = services.sort((a,b) => 
            b.rating == a.rating 
            ? b.reviewCount - a.reviewCount : b.rating - a.rating);

            res.status(200).json({topServices: sorted})
    }

    catch(error: any){res.status(500).json({error: error.message});}
};

export const getTopSubServicesAnalytics = async (req: Request, res: Response) =>{
    try{
        const servicesSnap = await db.collection("services").get();
        const sessionSnap = await db.collection("sessions").where("rated","==",true).get();


        const subServiceMap: Record <string, any> = {};

        sessionSnap.forEach((doc) => {
            const session = doc.data();

            for(const ir of session.ratings?.itemRatings || []){
                const key = `${ir.serviceId}:${ir.subServiceId}`;
                if(!subServiceMap[key]) subServiceMap[key] = [];
                subServiceMap[key].push({
                    comment: session.ratings.comment,
                    rating: ir.rating,
                });
            }
        });

        const allSubServices: any [] = [];

        for(const serviceDoc of servicesSnap.docs){
            const subSnap = await db.collection("services").doc(serviceDoc.id).collection("subServices").get();

            subSnap.forEach((subDoc) => {
                const key = `${serviceDoc.id}:${subDoc.id}`;
                const data = subDoc.data();

                const reviews = subServiceMap[key] || [];

                allSubServices.push({
                    subServiceId: subDoc.id,
                    serviceId: serviceDoc.id,
                    name: data.name,
                    rating: data.rating || 0,
                    reviewCount: data.reviewCount || 0,
                    reviews
                });
            });

        }

        const sorted = allSubServices.sort((a, b) =>
            b.rating === a.rating
            ? b.reviewCount - a.reviewCount
                : b.rating - a.rating
        );

        res.status(200).json({topSubServices: sorted})
    }catch(error: any){
        res.status(500).json({error: error.message});
    }
}


export const getTopItemsAnalytics = async (req: Request, res: Response) => {
  try {
    const servicesSnap = await db.collection("services").get();
    const sessionsSnap = await db.collection("sessions").where("rated", "==", true).get();

    const itemMap: Record<string, any> = {};

    sessionsSnap.forEach((doc) => {
      const session = doc.data();
      for (const ir of session.ratings?.itemRatings || []) {
        const key = `${ir.serviceId}:${ir.subServiceId}:${ir.itemId}`;
        if (!itemMap[key]) itemMap[key] = [];
        itemMap[key].push({
          comment: session.ratings.comment,
          rating: ir.rating,
        });
      }
    });

    const allItems: any[] = [];

    for (const serviceDoc of servicesSnap.docs) {
      const subSnap = await db
        .collection("services")
        .doc(serviceDoc.id)
        .collection("subServices")
        .get();

      for (const subDoc of subSnap.docs) {
        const itemSnap = await db
          .collection("services")
          .doc(serviceDoc.id)
          .collection("subServices")
          .doc(subDoc.id)
          .collection("items")
          .get();

        itemSnap.forEach((itemDoc) => {
          const key = `${serviceDoc.id}:${subDoc.id}:${itemDoc.id}`;
          const data = itemDoc.data();
          const reviews = itemMap[key] || [];

          allItems.push({
            itemId: itemDoc.id,
            subServiceId: subDoc.id,
            serviceId: serviceDoc.id,
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




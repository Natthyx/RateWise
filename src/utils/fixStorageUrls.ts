import admin from "../config/firebase";

// Function to fix storage URLs in existing subscriptions
export const fixSubscriptionStorageUrls = async () => {
    try {
        console.log('🔍 Checking for subscriptions with incorrect storage URLs...');
        
        const db = admin.firestore();
        const subscriptionsSnapshot = await db.collection("subscriptions").get();
        
        let fixedCount = 0;
        
        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data();
            
            // Check if receiptImageUrl exists and contains the wrong format (appspot.com)
            if (subscription.receiptImageUrl && subscription.receiptImageUrl.includes('appspot.com')) {
                // Fix the URL to use firebasestorage.app instead
                let fixedUrl = subscription.receiptImageUrl.replace('appspot.com', 'firebasestorage.app');
                
                // Also fix the path from receipts/ to payment_screenshots/
                if (fixedUrl.includes('/receipts/')) {
                    fixedUrl = fixedUrl.replace('/receipts/', '/payment_screenshots/');
                    console.log(`🔧 Also fixing path from /receipts/ to /payment_screenshots/`);
                }
                
                console.log(`🔧 Fixing URL for subscription ${doc.id}`);
                console.log(`   Old: ${subscription.receiptImageUrl}`);
                console.log(`   New: ${fixedUrl}`);
                
                // Update the document
                await db.collection("subscriptions").doc(doc.id).update({
                    receiptImageUrl: fixedUrl
                });
                
                console.log(`✅ Fixed URL for subscription ${doc.id}`);
                fixedCount++;
            } 
            // Check if receiptImageUrl exists and has the wrong path
            else if (subscription.receiptImageUrl && subscription.receiptImageUrl.includes('/receipts/')) {
                // Fix the path from receipts/ to payment_screenshots/
                const fixedUrl = subscription.receiptImageUrl.replace('/receipts/', '/payment_screenshots/');
                
                console.log(`🔧 Fixing path for subscription ${doc.id}`);
                console.log(`   Old: ${subscription.receiptImageUrl}`);
                console.log(`   New: ${fixedUrl}`);
                
                // Update the document
                await db.collection("subscriptions").doc(doc.id).update({
                    receiptImageUrl: fixedUrl
                });
                
                console.log(`✅ Fixed path for subscription ${doc.id}`);
                fixedCount++;
            }
            else if (subscription.receiptImageUrl) {
                console.log(`✅ Subscription ${doc.id} already has correct URL format: ${subscription.receiptImageUrl}`);
            }
        }
        
        console.log(`✨ Fixed ${fixedCount} subscription records with incorrect storage URLs`);
        return fixedCount;
    } catch (error) {
        console.error('❌ Error fixing subscription storage URLs:', error);
        throw error;
    }
};

// Run the fix function if this file is executed directly
if (require.main === module) {
    fixSubscriptionStorageUrls()
        .then(() => {
            console.log('🎉 URL fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 URL fix failed:', error);
            process.exit(1);
        });
}
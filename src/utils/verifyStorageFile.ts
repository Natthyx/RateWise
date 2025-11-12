import admin from "../config/firebase";

// Function to verify if a file exists in Firebase Storage
export const verifyStorageFile = async (filePath: string) => {
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);
        
        // Check if file exists
        const [exists] = await file.exists();
        
        if (exists) {
            console.log(`✅ File exists: ${filePath}`);
            
            // Get file metadata
            const [metadata] = await file.getMetadata();
            console.log(`📁 File metadata:`, metadata);
            
            // Check if file is publicly readable
            try {
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60, // 1 hour
                });
                console.log(`🔗 Signed URL: ${url}`);
            } catch (urlError) {
                console.log(`⚠️ Could not generate signed URL:`, urlError);
            }
            
            return true;
        } else {
            console.log(`❌ File does not exist: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error verifying file ${filePath}:`, error);
        return false;
    }
};

// Run the verification if this file is executed directly
if (require.main === module) {
    const filePath = process.argv[2];
    if (!filePath) {
        console.log('Usage: npx ts-node verifyStorageFile.ts <file-path>');
        process.exit(1);
    }
    
    verifyStorageFile(filePath)
        .then((exists) => {
            if (exists) {
                console.log('🎉 File verification completed successfully');
            } else {
                console.log('💥 File verification failed');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 File verification failed:', error);
            process.exit(1);
        });
}
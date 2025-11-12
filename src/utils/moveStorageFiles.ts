import admin from "../config/firebase";

// Function to move files from /receipts/ to /payment_screenshots/ path
export const moveStorageFiles = async () => {
    try {
        console.log('🔍 Checking for files in /receipts/ path...');
        
        const bucket = admin.storage().bucket();
        
        // List all files in the receipts directory
        const [files] = await bucket.getFiles({ prefix: 'receipts/' });
        
        let movedCount = 0;
        
        for (const file of files) {
            const fileName = file.name;
            console.log(`📁 Found file: ${fileName}`);
            
            // Check if it's a receipt file (not a directory)
            if (fileName.endsWith('/')) {
                console.log(`⏭️ Skipping directory: ${fileName}`);
                continue;
            }
            
            // Create new file name with payment_screenshots path
            const newFileName = fileName.replace('receipts/', 'payment_screenshots/');
            console.log(`🔄 Moving ${fileName} to ${newFileName}`);
            
            // Copy the file to the new location
            await file.copy(newFileName);
            
            // Make the new file publicly readable
            const newFile = bucket.file(newFileName);
            await newFile.makePublic();
            
            // Delete the old file
            await file.delete();
            
            console.log(`✅ Moved file: ${fileName} -> ${newFileName}`);
            movedCount++;
        }
        
        console.log(`✨ Moved ${movedCount} files from /receipts/ to /payment_screenshots/`);
        return movedCount;
    } catch (error) {
        console.error('❌ Error moving storage files:', error);
        throw error;
    }
};

// Run the move function if this file is executed directly
if (require.main === module) {
    moveStorageFiles()
        .then(() => {
            console.log('🎉 File move completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 File move failed:', error);
            process.exit(1);
        });
}
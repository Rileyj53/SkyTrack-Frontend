const fs = require('fs');
const path = require('path');

// Input and output file paths
const inputFile = path.join(__dirname, '../public/world-airports.csv');
const outputFile = path.join(__dirname, '../public/world-airports-clean.csv');

console.log('🧹 Cleaning airport data...');
console.log('📂 Input:', inputFile);
console.log('📂 Output:', outputFile);

try {
    // Read the CSV file
    const csvData = fs.readFileSync(inputFile, 'utf8');
    const lines = csvData.trim().split('\n');

    console.log(`📊 Original file has ${lines.length - 1} airports`);

    // Get headers
    const headers = lines[0];
    const headerArray = headers.split(',');
    const typeIndex = headerArray.findIndex(header => header.trim().toLowerCase() === 'type');

    if (typeIndex === -1) {
        throw new Error('Could not find "type" column in CSV');
    }

    console.log(`🔍 Found "type" column at index ${typeIndex}`);

    // Filter out unwanted airport types
    const filteredLines = [headers]; // Keep headers
    let removedCount = 0;
    let closedCount = 0;
    let heliportCount = 0;
    let balloonportCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const columns = line.split(',');

        if (columns.length <= typeIndex) {
            console.warn(`⚠️  Skipping malformed line ${i}: ${line.substring(0, 50)}...`);
            continue;
        }

        const type = (columns[typeIndex] || '').trim().toLowerCase();

        // Check if this is a closed airport, heliport, or balloonport
        const isClosed = type.includes('closed');
        const isHeliport = type.includes('heliport');
        const isBalloonport = type.includes('balloonport');

        if (isClosed || isHeliport || isBalloonport) {
            removedCount++;
            if (isClosed) closedCount++;
            if (isHeliport) heliportCount++;
            if (isBalloonport) balloonportCount++;

            // Log some examples of what we're removing
            if (removedCount <= 10) {
                const name = columns[headerArray.findIndex(h => h.trim().toLowerCase() === 'name')] || 'Unknown';
                console.log(`❌ Removing: ${name.substring(0, 30)}... (${type})`);
            }
        } else {
            // Keep this airport
            filteredLines.push(line);
        }
    }

    // Write the cleaned data
    const cleanedData = filteredLines.join('\n');
    fs.writeFileSync(outputFile, cleanedData);

    // Summary
    console.log('\n✅ Cleaning complete!');
    console.log(`📊 Original airports: ${lines.length - 1}`);
    console.log(`❌ Closed airports removed: ${closedCount}`);
    console.log(`🚁 Heliports removed: ${heliportCount}`);
    console.log(`🎈 Balloonports removed: ${balloonportCount}`);
    console.log(`🗑️  Total removed: ${removedCount}`);
    console.log(`✈️  Remaining airports: ${filteredLines.length - 1}`);
    console.log(`💾 Saved to: ${outputFile}`);

    // Calculate file size reduction
    const originalSize = fs.statSync(inputFile).size;
    const newSize = fs.statSync(outputFile).size;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`📦 File size: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (${reduction}% reduction)`);

} catch (error) {
    console.error('❌ Error processing file:', error.message);
    process.exit(1);
}
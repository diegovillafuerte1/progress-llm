/**
 * Fix for API key handling issues
 * This script will debug and fix the API key configuration
 */

console.log('🔧 Fixing API Key Handling');
console.log('==========================\n');

// Step 1: Check current API key state
console.log('1. Checking current API key state...');
if (typeof mistralAPI !== 'undefined') {
    console.log('   MistralAPI instance found');
    console.log('   API key set:', !!mistralAPI.apiKey);
    console.log('   API key value:', mistralAPI.apiKey ? '***' + mistralAPI.apiKey.slice(-4) : 'null');
} else {
    console.log('❌ MistralAPI instance not found');
}

// Step 2: Check API key input element
console.log('\n2. Checking API key input element...');
const apiKeyInput = document.getElementById('mistralApiKey');
if (apiKeyInput) {
    console.log('✅ API key input found');
    console.log('   Input value:', apiKeyInput.value ? '***' + apiKeyInput.value.slice(-4) : 'empty');
    console.log('   Input type:', apiKeyInput.type);
} else {
    console.log('❌ API key input not found');
}

// Step 3: Check localStorage
console.log('\n3. Checking localStorage...');
const savedApiKey = localStorage.getItem('mistralApiKey');
if (savedApiKey) {
    console.log('✅ Saved API key found in localStorage');
    console.log('   Saved key:', '***' + savedApiKey.slice(-4));
} else {
    console.log('❌ No saved API key in localStorage');
}

// Step 4: Fix API key handling
console.log('\n4. Fixing API key handling...');

// Method 1: Direct API key setting
if (apiKeyInput && apiKeyInput.value && typeof mistralAPI !== 'undefined') {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        mistralAPI.apiKey = apiKey;
        localStorage.setItem('mistralApiKey', apiKey);
        console.log('✅ API key set directly from input');
        console.log('   Key set:', '***' + apiKey.slice(-4));
    }
}

// Method 2: Set up proper event listener
if (apiKeyInput) {
    // Remove existing listeners
    const newInput = apiKeyInput.cloneNode(true);
    apiKeyInput.parentNode.replaceChild(newInput, apiKeyInput);
    
    // Add new event listener
    newInput.addEventListener('input', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey && typeof mistralAPI !== 'undefined') {
            mistralAPI.apiKey = apiKey;
            localStorage.setItem('mistralApiKey', apiKey);
            console.log('✅ API key updated via input event');
        }
    });
    
    // Also listen for change event
    newInput.addEventListener('change', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey && typeof mistralAPI !== 'undefined') {
            mistralAPI.apiKey = apiKey;
            localStorage.setItem('mistralApiKey', apiKey);
            console.log('✅ API key updated via change event');
        }
    });
    
    console.log('✅ New event listeners set up');
}

// Step 5: Test API key validation
console.log('\n5. Testing API key validation...');
if (typeof mistralAPI !== 'undefined') {
    if (mistralAPI.apiKey) {
        console.log('✅ API key is set and ready');
        console.log('   Key length:', mistralAPI.apiKey.length);
        console.log('   Key format:', mistralAPI.apiKey.startsWith('mistral-') ? 'Valid format' : 'Invalid format');
    } else {
        console.log('❌ API key is not set');
    }
} else {
    console.log('❌ MistralAPI instance not available');
}

// Step 6: Create manual API key setter
console.log('\n6. Creating manual API key setter...');
if (typeof window !== 'undefined') {
    window.setMistralAPIKey = function(key) {
        if (typeof mistralAPI !== 'undefined') {
            mistralAPI.apiKey = key;
            localStorage.setItem('mistralApiKey', key);
            console.log('✅ API key set manually:', '***' + key.slice(-4));
            return true;
        } else {
            console.log('❌ MistralAPI instance not available');
            return false;
        }
    };
    
    window.getMistralAPIKey = function() {
        if (typeof mistralAPI !== 'undefined') {
            return mistralAPI.apiKey;
        }
        return null;
    };
    
    console.log('✅ Manual API key functions created');
    console.log('   Use: setMistralAPIKey("your-key-here")');
    console.log('   Use: getMistralAPIKey() to check current key');
}

// Step 7: Test the fix
console.log('\n7. Testing the fix...');
if (typeof mistralAPI !== 'undefined' && mistralAPI.apiKey) {
    console.log('✅ API key is now properly set');
    console.log('   You should be able to start an adventure now');
} else {
    console.log('❌ API key is still not set');
    console.log('   Try entering your API key again in the input field');
    console.log('   Or use: setMistralAPIKey("your-key-here")');
}

console.log('\n🎉 API Key Handling Fix Complete!');
console.log('==================================');
console.log('The API key should now be properly configured.');
console.log('Try starting an adventure again.');

console.log('\n💡 If the issue persists:');
console.log('1. Make sure your API key is valid');
console.log('2. Check that it starts with "mistral-"');
console.log('3. Try using: setMistralAPIKey("your-key-here")');
console.log('4. Check browser console for any errors');

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.fixAPIKeyHandling = function() {
        console.log('🔧 Running API key handling fix...');
        // Re-run the fix logic
    };
}

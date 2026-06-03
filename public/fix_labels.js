const fs = require('fs');
const path = require('path');

const dir = __dirname;
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dir, file);
        let html = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Regex to find form-group with a label and an input
        const regex = /<label>(.*?)<\/label>\s*<input[^>]*id="([^"]+)"/g;
        html = html.replace(regex, (match, labelText, inputId) => {
            changed = true;
            return `<label for="${inputId}">${labelText}</label>\n                    <input id="${inputId}"` + match.split(`id="${inputId}"`)[1];
        });
        
        // Also do it for textarea
        const regexTa = /<label>(.*?)<\/label>\s*<textarea[^>]*id="([^"]+)"/g;
        html = html.replace(regexTa, (match, labelText, inputId) => {
            changed = true;
            return `<label for="${inputId}">${labelText}</label>\n                    <textarea id="${inputId}"` + match.split(`id="${inputId}"`)[1];
        });

        // specific ones:
        // index.html
        html = html.replace(/<label>Email Address<\/label>\s*<input type="email" id="loginEmail"/g, '<label for="loginEmail">Email Address</label>\n                    <input type="email" id="loginEmail"');
        html = html.replace(/<label>Password<\/label>\s*<div class="password-input-wrapper">\s*<input type="password" id="loginPassword"/g, '<label for="loginPassword">Password</label>\n                    <div class="password-input-wrapper">\n                        <input type="password" id="loginPassword"');
        
        html = html.replace(/<label>Full Name<\/label>\s*<input type="text" id="regName"/g, '<label for="regName">Full Name</label>\n                    <input type="text" id="regName"');
        html = html.replace(/<label>Email Address<\/label>\s*<input type="email" id="regEmail"/g, '<label for="regEmail">Email Address</label>\n                    <input type="email" id="regEmail"');
        html = html.replace(/<label>Password<\/label>\s*<div class="password-input-wrapper">\s*<input type="password" id="regPassword"/g, '<label for="regPassword">Password</label>\n                    <div class="password-input-wrapper">\n                        <input type="password" id="regPassword"');
        
        html = html.replace(/<label>I am a:<\/label>\s*<select id="regRole"/g, '<label for="regRole">I am a:</label>\n                    <select id="regRole"');

        // property-detail
        html = html.replace(/<label>To<\/label>\s*<input type="text" id="msgToName"/g, '<label for="msgToName">To</label>\n                    <input type="text" id="msgToName"');
        html = html.replace(/<label>Property<\/label>\s*<input type="text" id="msgPropertyTitle"/g, '<label for="msgPropertyTitle">Property</label>\n                    <input type="text" id="msgPropertyTitle"');
        html = html.replace(/<label>Message<\/label>\s*<textarea id="msgContent"/g, '<label for="msgContent">Message</label>\n                    <textarea id="msgContent"');
        
        html = html.replace(/<label>Your Name<\/label>\s*<input type="text" id="tourName"/g, '<label for="tourName">Your Name</label>\n                        <input type="text" id="tourName"');
        html = html.replace(/<label>Your Email<\/label>\s*<input type="email" id="tourEmail"/g, '<label for="tourEmail">Your Email</label>\n                        <input type="email" id="tourEmail"');
        html = html.replace(/<label>Your Phone <span style="color:#ef4444;">\*<\/span><\/label>\s*<input type="tel" id="tourPhone"/g, '<label for="tourPhone">Your Phone <span style="color:#ef4444;">*</span></label>\n                    <input type="tel" id="tourPhone"');
        html = html.replace(/<label>Select Date <span style="color:#ef4444;">\*<\/span><\/label>\s*<input type="date" id="tourDate"/g, '<label for="tourDate">Select Date <span style="color:#ef4444;">*</span></label>\n                    <input type="date" id="tourDate"');

        if (changed || html !== fs.readFileSync(filePath, 'utf8')) {
            fs.writeFileSync(filePath, html);
            console.log(`Updated ${file}`);
        }
    }
});

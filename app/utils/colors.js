function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return {r, g, b};
}

function rgbToHex(r, g, b) {
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    const hexColor = `#${rHex}${gHex}${bHex}`;

    return hexColor.toUpperCase();
}


module.exports = { hexToRgb, rgbToHex }

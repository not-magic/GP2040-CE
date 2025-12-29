// Convert a hex string to a number
const hexToInt = (hex) => {
	return parseInt(hex.replace('#', ''), 16);
};

// Convert a number to hex
const intToHex = (d) => {
	return ('0' + Number(d).toString(16)).slice(-2).toLowerCase();
};

// Convert a 32-bit ARGB value to hex format
const rgbIntToHex = (rgbInt) => {
	let r = (rgbInt >> 16) & 255;
	let g = (rgbInt >> 8) & 255;
	let b = (rgbInt >> 0) & 255;

	return `#${intToHex(r)}${intToHex(g)}${intToHex(b)}`;
};

// Takes an array of 8-bit RGB values and returns the hex value
const rgbArrayToHex = (values) => {
	let [r, g, b] = values;

	if (!(r >= 0 && r <= 255)) r = 0;
	if (!(g >= 0 && g <= 255)) g = 0;
	if (!(b >= 0 && b <= 255)) r = 0;

	return `#${intToHex(r)}${intToHex(g)}${intToHex(b)}`;
};

const rgbMix = (x, y, a) => {

	const one_minus_a = 1-a;
	return [
		x[0] * one_minus_a + y[0] * a,
		x[1] * one_minus_a + y[1] * a,
		x[2] * one_minus_a + y[2] * a
	];
};

const hexToRgbArray = (hex, error_color = [255,0,255]) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
	] : error_color;
};

const rgbWheel = (pos) => {
	pos = 255 - pos;
	if (pos < 85) {
		return rgbArrayToHex([255 - pos * 3, 0, pos * 3]);
	} else if (pos < 170) {
		pos -= 85;
		return rgbArrayToHex([0, pos * 3, 255 - pos * 3]);
	} else {
		pos -= 170;
		return rgbArrayToHex([pos * 3, 255 - pos * 3, 0]);
	}
};

const createEnumRecord = <T extends Record<string, number | string>>(
	enumObj: T,
): Record<keyof T, T[keyof T]> =>
Object.fromEntries(
		Object.entries(enumObj).filter(([, value]) => typeof value === 'number'),
	) as Record<keyof T, T[keyof T]>;


export { hexToInt, intToHex, rgbArrayToHex, hexToRgbArray, rgbIntToHex, rgbMix, rgbWheel, createEnumRecord };

import React, {useRef, useEffect} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FormCheck, Row, Col } from 'react-bootstrap';
import * as yup from 'yup';

import Canvas from '../Components/Section';
import Section from '../Components/Section';
import FormSelect from '../Components/FormSelect';
import FormControl from '../Components/FormControl';
import { AddonPropTypes } from '../Pages/AddonsConfigPage';

export const analogToDpadScheme = {
	AnalogToDpadInputEnabled: yup.number().required().label('Analog To Dpad Input Enabled'),
	analogToDpadDeadzone: yup
		.number()
		.label('Deadzone')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpadSquareness: yup
		.number()
		.label('Squareness')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpadSlope: yup
		.number()
		.label('Slope')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpadOffset: yup
		.number()
		.label('Offest')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpadDebounce: yup
		.number()
		.label('Debounce')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
};

export const analogToDpadState = {
	AnalogToDpadInputEnabled: 0,
	analogToDpadSquareness: 0,
	analogToDpadDeadzone: 60,
	analogToDpadSlope: 20,
	analogToDpadOffset: 20,
	analogToDpadDebounce: 5,
};

const AnalogToDpad = ({ values, errors, handleChange, handleCheckbox }: AddonPropTypes) => {
	const { t } = useTranslation();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const squareness = values.analogToDpadSquareness * 0.04;
		const deadzone = values.analogToDpadDeadzone * 0.01;
		const debounce = values.analogToDpadDebounce * 0.01;
		const cardinal_slope = values.analogToDpadSlope * 0.01;
		const cardinal_offset = values.analogToDpadOffset * 0.01;

		function mix_colors(a, b) {
			return [
					(a[0]+b[0])/2,
					(a[1]+b[1])/2,
					(a[2]+b[2])/2
				];
		}

		function hexToRgb(hex) {
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
			] : [255, 0, 255];
		}


		const style = getComputedStyle(document.body);
		const deadzone_color = hexToRgb(style.getPropertyValue("--bs-dark"));
		const diagonal_color = hexToRgb(style.getPropertyValue("--bs-pink"));
		const cardinal_color = hexToRgb(style.getPropertyValue("--bs-teal"));
		const debounce_color = hexToRgb(style.getPropertyValue("--bs-yellow"));

		function colorFunction(x:float, y:float) {

			x = Math.pow(Math.abs(x), 1+squareness) * (x > 0 ? 1 : -1);
			y = Math.pow(Math.abs(y), 1+squareness) * (y > 0 ? 1 : -1);

			let cardinal = function(value, other_value, in_debounce) {

				const near_deadzone = deadzone-in_debounce;
				const dsquared = (value*value)+(other_value*other_value);
				if (dsquared < near_deadzone*near_deadzone) {
					return 0;
				}

				const offset = cardinal_offset-in_debounce;

				if (value > offset) {
					if (Math.abs(other_value/(value-offset))*cardinal_slope < 1) {
						return 1;
					}
				} else if (value < -offset) {
					if (Math.abs(other_value/(value+offset))*cardinal_slope < 1) {
						return -1;
					}
				}

				return 0;
			};
				
			const ix = cardinal(x, y, 0);
			const nx = cardinal(x, y, debounce);
			const iy = cardinal(y, x, 0);
			const ny = cardinal(y, x, debounce);

			if (ix && iy) {
				return diagonal_color;
			} else if ((nx && iy) || (ny && ix)) {
				return debounce_color;
			} else if (nx && ny) {
				return mix_colors(debounce_color, deadzone_color);
			} else if (ix || iy) {
				return cardinal_color;
			} else if (nx || ny) {
				return mix_colors(cardinal_color, deadzone_color);
			}

			return deadzone_color;
		}

		function render() {
			if (!values.AnalogToDpadInputEnabled) {
				return;
			}

			let canvas = canvasRef.current;
			const ctx = canvas.getContext('2d');

		    const width = canvas.width;
		    const height = canvas.height;
		    const imageData = ctx.createImageData(width, height);

	        // Loop through each pixel
	        for (let py = 0; py < height; py++) {
	            for (let px = 0; px < width; px++) {
	                // Map pixel coordinates to -1 to 1 range
	                const x = (px / width) * 2 - 1;
	                const y = (py / height) * 2 - 1;

	                const [r, g, b] = colorFunction(x, y);

	                const index = (py * width + px) * 4;
	                imageData.data[index + 0] = r; // R
	                imageData.data[index + 1] = g; // G
	                imageData.data[index + 2] = b; // B
	                imageData.data[index + 3] = 255; // A
	            }
	        }

	        ctx.putImageData(imageData, 0, 0);
		}

		render();

	}, [values.AnalogToDpadInputEnabled, values.analogToDpadSquareness, values.analogToDpadDeadzone, values.analogToDpadDebounce, values.analogToDpadSlope, values.analogToDpadOffset]);

	return (
		<Section title={t('AddonsConfig:analog-to-dpad-header-text')}>
			<div id="AnalogToDpadOptions" hidden={!values.AnalogToDpadInputEnabled}>
				<div className="alert alert-info" role="alert">
					<Trans
						ns="AddonsConfig"
						i18nKey='AddonsConfig:pin-config-moved-to-core-text'
						components={[
							<a
								key="0"
								href="../pin-mapping"
								className="alert-link"
								target="_blank"
							/>
						]}
					/>
				</div>
				<Row>
				<Col sm={4}><center><canvas ref={canvasRef} width="300" height="300"/></center></Col>
				<Col><Row className="mb-3">
					<p>{t('AddonsConfig:analog-to-dpad-deadzone-text')}</p>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-deadzone-label')}
						name="analogToDpadDeadzone"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.analogToDpadDeadzone}
						error={errors.analogToDpadDeadzone}
						isInvalid={errors.analogToDpadDeadzone}
						onChange={handleChange}
						min={0}
						max={100}
					/>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-squareness-label')}
						name="analogToDpadSquareness"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.analogToDpadSquareness}
						error={errors.analogToDpadSquareness}
						isInvalid={errors.analogToDpadSquareness}
						onChange={handleChange}
						min={0}
						max={100}
					/>

				</Row>

				<Row className="mb-3">
					<p>{t('AddonsConfig:analog-to-dpad-switch-slope-offset-text')}</p>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-switch-slope-label')}
						name="analogToDpadSlope"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.analogToDpadSlope}
						error={errors.analogToDpadSlope}
						isInvalid={errors.analogToDpadSlope}
						onChange={handleChange}
						min={0}
						max={100}
					/>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-switch-offset-label')}
						name="analogToDpadOffset"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.analogToDpadOffset}
						error={errors.analogToDpadOffset}
						isInvalid={errors.analogToDpadOffset}
						onChange={handleChange}
						min={0}
						max={100}
					/>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-debounce-label')}
						name="analogToDpadDebounce"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.analogToDpadDebounce}
						error={errors.analogToDpadDebounce}
						isInvalid={errors.analogToDpadDebounce}
						onChange={handleChange}
						min={0}
						max={100}
					/>						
				</Row></Col>
			</Row>
			</div>
			<FormCheck
				label={t('Common:switch-enabled')}
				type="switch"
				id="AnalogToDpadInputButton"
				reverse
				isInvalid={false}
				checked={Boolean(values.AnalogToDpadInputEnabled)}
				onChange={(e) => {
					handleCheckbox('AnalogToDpadInputEnabled', values);
					handleChange(e);
				}}
			/>
		</Section>
	);
};

export default AnalogToDpad;

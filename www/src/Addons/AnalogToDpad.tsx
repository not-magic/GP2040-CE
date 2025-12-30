import React, {useRef, useEffect} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FormCheck, Row, Col, Tab, Tabs, Form } from 'react-bootstrap';
import * as yup from 'yup';
import { hexToRgbArray, rgbMix } from '../Services/Utilities';

import Section from '../Components/Section';
import FormSelect from '../Components/FormSelect';
import FormControl from '../Components/FormControl';
import { AddonPropTypes } from '../Pages/AddonsConfigPage';

export const analogToDpadScheme = {
	AnalogToDpadInputEnabled: yup.number().required().label('Analog To Dpad Input Enabled'),
	analogToDpad8WayDeadzone: yup
		.number()
		.label('8-Way Deadzone')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 1, 100),
	analogToDpad8WaySquareness: yup
		.number()
		.label('8-Way Squareness')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', -50, 100),
	analogToDpad8WaySlope: yup
		.number()
		.label('8-Way Slope')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpad8WayOffset: yup
		.number()
		.label('8-Way Offset')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpad8WayDebounce: yup
		.number()
		.label('Debounce')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpad4WayDeadzone: yup
		.number()
		.label('4-Way Deadzone')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 1, 100),
	analogToDpad4WaySquareness: yup
		.number()
		.label('4-Way Squareness')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', -50, 100),
	analogToDpad4WayOffset: yup
		.number()
		.label('4-Way Offset')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpad4WayDebounce: yup
		.number()
		.label('4-Way Debounce')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	analogToDpadSource: yup.number().required().label('Source'),
};

export const analogToDpadState = {
	AnalogToDpadInputEnabled: 0,
	analogToDpad8WaySquareness: 0,
	analogToDpad8WayDeadzone: 60,
	analogToDpad8WaySlope: 20,
	analogToDpad8WayOffset: 20,
	analogToDpad8WayDebounce: 5,
	analogToDpad4WaySquareness: 0,
	analogToDpad4WayDeadzone: 60,
	analogToDpad4WayOffset: 20,
	analogToDpad4WayDebounce: 5,
	analogToDpadSource: 0,
};

const AnalogToDpad = ({ values, errors, handleChange, handleCheckbox, setFieldValue }: AddonPropTypes) => {
	const { t } = useTranslation();
	const canvas4WayRef = useRef<HTMLCanvasElement>(null);
	const canvas8WayRef = useRef<HTMLCanvasElement>(null);

	const renderCanvas = function(enabled, canvas, colorFunction) {

		if (!enabled || !canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

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
	};

	const applySquareness = function(x, y, squareness, deadzone) {
		const deadzone_scale = deadzone > 0 ? (deadzone / Math.pow(deadzone, 1+squareness)) : 1.0;

		return [Math.pow(Math.abs(x), 1+squareness) * (x > 0 ? 1 : -1) * deadzone_scale, 
			   Math.pow(Math.abs(y), 1+squareness) * (y > 0 ? 1 : -1) * deadzone_scale];
	};

	// 8-way preview
	useEffect(() => {
		const squareness = values.analogToDpad8WaySquareness * 0.02;
		const deadzone = values.analogToDpad8WayDeadzone * 0.01;
		const debounce = values.analogToDpad8WayDebounce * 0.01;
		const cardinal_slope = values.analogToDpad8WaySlope * 0.01;
		const cardinal_offset = values.analogToDpad8WayOffset * 0.01;

		const style = getComputedStyle(document.body);
		const deadzone_color = hexToRgbArray(style.getPropertyValue("--bs-dark"));
		const diagonal_color = hexToRgbArray(style.getPropertyValue("--bs-pink"));
		const cardinal_color = hexToRgbArray(style.getPropertyValue("--bs-teal"));
		const debounce_color = hexToRgbArray(style.getPropertyValue("--bs-yellow"));

		function colorFunction(x:number, y:number) {

			[x, y] = applySquareness(x, y, squareness, deadzone);

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
				return rgbMix(debounce_color, deadzone_color, 0.5);
			} else if (ix || iy) {
				return cardinal_color;
			} else if (nx || ny) {
				return rgbMix(cardinal_color, deadzone_color, 0.5);
			}

			return deadzone_color;
		}

		renderCanvas(values.AnalogToDpadInputEnabled, canvas8WayRef.current, colorFunction);	

	}, [canvas8WayRef.current, values.AnalogToDpadInputEnabled, values.analogToDpad8WaySquareness, values.analogToDpad8WayDeadzone, values.analogToDpad8WayDebounce, values.analogToDpad8WaySlope, values.analogToDpad8WayOffset]);

	// 4-way preview
	useEffect(() => {
		const squareness = values.analogToDpad4WaySquareness * 0.02;
		const deadzone = values.analogToDpad4WayDeadzone * 0.01;
		const debounce = values.analogToDpad4WayDebounce * 0.01;
		const cardinal_offset = values.analogToDpad4WayOffset * 0.01;

		const style = getComputedStyle(document.body);
		const deadzone_color = hexToRgbArray(style.getPropertyValue("--bs-dark"));
		const x_color = hexToRgbArray(style.getPropertyValue("--bs-cyan"));
		const y_color = hexToRgbArray(style.getPropertyValue("--bs-purple"));
		const debounce_color = hexToRgbArray(style.getPropertyValue("--bs-yellow"));

		function colorFunction(x:number, y:number) {

			[x, y] = applySquareness(x, y, squareness, deadzone);

			let cardinal = function(debounce_x, debounce_y) {

				// 4-way mode will only ever have one of these active at a time
				const debounced_deadzone = Math.max(0, deadzone - (debounce_x + debounce_y));

				const dist_squared = (x*x)+(y*y);
				const offset_x = cardinal_offset - debounce_x;
				const offset_y = cardinal_offset - debounce_y;

				let result_x = 0;
				let result_y = 0;

				if (dist_squared > debounced_deadzone*debounced_deadzone && (Math.abs(x) > offset_x || Math.abs(y) > offset_y)) {
					// if we're in the active region we always return one value, based on whichever is longest after debouncing

					if (Math.abs(x)+debounce_x > Math.abs(y)+debounce_y) {

						result_x = x > 0 ? 1 : -1;

					} else {

						result_y = y > 0 ? 1 : -1;
					}
				}

				return [result_x, result_y];
			};
			
			const [ix, iy] = cardinal(0, 0);
			const [nx, tmp1] = cardinal(debounce, 0);
			const [tmp2, ny] = cardinal(0, debounce);

			const use_cardinal_color = nx ? x_color : y_color;

			if (ix && iy) {
				return use_cardinal_color;
			} else if ((nx && iy) || (ny && ix)) {
				return debounce_color;
			} else if (nx && ny) {
				return rgbMix(debounce_color, deadzone_color, 0.5);
			} else if (ix || iy) {
				return use_cardinal_color;
			} else if (nx || ny) {
				return rgbMix(use_cardinal_color, deadzone_color, 0.5);
			}

			return deadzone_color;
		}

		renderCanvas(values.AnalogToDpadInputEnabled, canvas4WayRef.current, colorFunction);	

	}, [canvas4WayRef.current, values.AnalogToDpadInputEnabled, values.analogToDpad4WaySquareness, values.analogToDpad4WayDeadzone, values.analogToDpad4WayDebounce, values.analogToDpad4WayOffset]);

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
				<Row className="mb-3">
					<FormSelect
						label={t('AddonsConfig:analog-to-dpad-source-label')}
						name="analogToDpadSource"
						className="form-select-sm"
						groupClassName="col-sm-2 mb-3"
						value={values.analogToDpadSource}
						error={errors.analogToDpadSource}
						isInvalid={Boolean(errors.analogToDpadSource)}
						onChange={(e) =>
							setFieldValue('analogToDpadSource', parseInt(e.target.value))
						}
					>
						<option value="0">
							{t('AddonsConfig:analog-to-dpad-source-1')}
						</option>
						<option value="1">
							{t('AddonsConfig:analog-to-dpad-source-2')}
						</option>
					</FormSelect>
			
				</Row>
				<Row className="mb-3">
					<Tabs
						defaultActiveKey="mode8wayConfig"
						id="analogConfigTabs"
						className="mb-3 pb-0"
						fill
					>
						<Tab
							key="mode8wayConfig"
							eventKey="mode8wayConfig"
							title={t('AddonsConfig:analog-to-dpad-mode-8-way')}
						>
							<Row>
								<Col lg={4}><center><canvas ref={canvas8WayRef} width="300" height="300"/></center></Col>
								<Col>						
									<Row className="mb-3">
										<p>{t('AddonsConfig:analog-to-dpad-deadzone-text')}</p>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-deadzone-label')}
											name="analogToDpad8WayDeadzone"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad8WayDeadzone}
											error={errors.analogToDpad8WayDeadzone}
											isInvalid={errors.analogToDpad8WayDeadzone}
											onChange={handleChange}
											min={1}
											max={100}
										/>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-squareness-label')}
											name="analogToDpad8WaySquareness"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad8WaySquareness}
											error={errors.analogToDpad8WaySquareness}
											isInvalid={errors.analogToDpad8WaySquareness}
											onChange={handleChange}
											min={-50}
											max={100}
										/>

									</Row>

									<Row className="mb-3" >
										<p>{t('AddonsConfig:analog-to-dpad-switch-8way-options-text')}</p>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-switch-slope-label')}
											name="analogToDpad8WaySlope"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad8WaySlope}
											error={errors.analogToDpad8WaySlope}
											isInvalid={errors.analogToDpad8WaySlope}
											onChange={handleChange}
											min={0}
											max={100}
										/>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-switch-offset-label')}
											name="analogToDpad8WayOffset"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad8WayOffset}
											error={errors.analogToDpad8WayOffset}
											isInvalid={errors.analogToDpad8WayOffset}
											onChange={handleChange}
											min={0}
											max={100}
										/>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-debounce-label')}
											name="analogToDpad8WayDebounce"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad8WayDebounce}
											error={errors.analogToDpad8WayDebounce}
											isInvalid={errors.analogToDpad8WayDebounce}
											onChange={handleChange}
											min={0}
											max={100}
										/>								
									</Row>
								</Col>
							</Row>
						</Tab>
						<Tab
							key="mode4wayConfig"
							eventKey="mode4wayConfig"
							title={t('AddonsConfig:analog-to-dpad-mode-4-way')}
						>
							<Row>
								<Col lg={4}><center><canvas ref={canvas4WayRef} width="300" height="300"/></center></Col>
								<Col>						
									<Row className="mb-3">
										<p>{t('AddonsConfig:analog-to-dpad-deadzone-text')}</p>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-deadzone-label')}
											name="analogToDpad4WayDeadzone"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad4WayDeadzone}
											error={errors.analogToDpad4WayDeadzone}
											isInvalid={errors.analogToDpad4WayDeadzone}
											onChange={handleChange}
											min={1}
											max={100}
										/>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-squareness-label')}
											name="analogToDpad4WaySquareness"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad4WaySquareness}
											error={errors.analogToDpad4WaySquareness}
											isInvalid={errors.analogToDpad4WaySquareness}
											onChange={handleChange}
											min={-50}
											max={100}
										/>

	
									</Row>

									<Row className="mb-3" >
										<p>{t('AddonsConfig:analog-to-dpad-switch-4way-options-text')}</p>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-switch-offset-label')}
											name="analogToDpad4WayOffset"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad4WayOffset}
											error={errors.analogToDpad4WayOffset}
											isInvalid={errors.analogToDpad4WayOffset}
											onChange={handleChange}
											min={0}
											max={100}
										/>

										<FormControl
											type="number"
											label={t('AddonsConfig:analog-to-dpad-debounce-label')}
											name="analogToDpad4WayDebounce"
											className="form-select-sm"
											groupClassName="col-sm-3 mb-3"
											value={values.analogToDpad4WayDebounce}
											error={errors.analogToDpad4WayDebounce}
											isInvalid={errors.analogToDpad4WayDebounce}
											onChange={handleChange}
											min={0}
											max={100}
										/>												
									</Row>
								</Col>
							</Row>
						</Tab>						
					</Tabs>
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

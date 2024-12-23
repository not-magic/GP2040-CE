import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormCheck, Row } from 'react-bootstrap';
import * as yup from 'yup';

import Section from '../Components/Section';
import FormSelect from '../Components/FormSelect';

import FormControl from '../Components/FormControl';

export const analogToDpadScheme = {
	AnalogToDpadInputEnabled: yup.number().required().label('Analog To Dpad Input Enabled'),
	deadzone: yup
		.number()
		.label('Deadzone')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 1, 100),
	enableDynamicDeadzone: yup
		.number()
		.required()
		.label('Enable Dynamic Deadzone'),
	dynamicDeadzone: yup
		.number()
		.label('Dynamic Deadzone')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 100),
	cardinalAngle: yup
		.number()
		.label('Cardinal Sensitivity (in degrees)')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 90),
	directionStickyness: yup
		.number()
		.label('Direction stickyness (in Degrees)')
		.validateRangeWhenValue('AnalogToDpadInputEnabled', 0, 90),
};

export const analogToDpadState = {
	AnalogToDpadInputEnabled: 0,
	deadzone: 0,
	enableDynamicDeadzone: 0,
	dynamicDeadzone: 0,
	cardinalAngle: 0,
	directionStickyness: 0,
};

const AnalogToDpad = ({ values, errors, handleChange, handleCheckbox }) => {
	const { t } = useTranslation();
	return (
		<Section title={t('AddonsConfig:analog-to-dpad-header-text')}>
			<div id="AnalogToDpadOptions" hidden={!values.AnalogToDpadInputEnabled}>
				<Row className="mb-3">
					<p>{t('AddonsConfig:analog-to-dpad-deadzone-text')}</p>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-deadzone')}
						name="deadzone"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.deadzone}
						error={errors.deadzone}
						isInvalid={errors.deadzone}
						onChange={handleChange}
						min={1}
						max={100}
					/>

					<FormCheck
						label={t(
							'AddonsConfig:analog-to-dpad-enable-dynamic-deadzone',
						)}
						type="switch"
						id="EnableDynamicDeadzone"
						className="col-sm-3 ms-2"
						isInvalid={false}
						checked={Boolean(values.enableDynamicDeadzone)}
						onChange={(e) => {
							handleCheckbox('enableDynamicDeadzone', values);
							handleChange(e);
						}}
					/>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-dynamic-deadzone')}
						name="dynamicDeadzone"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.dynamicDeadzone}
						error={errors.dynamicDeadzone}
						isInvalid={errors.dynamicDeadzone}
						onChange={handleChange}
						min={1}
						max={100}
					/>

				</Row>
				<Row className="mb-3">
					<p>{t('AddonsConfig:analog-to-dpad-cardinal-angle-text')}</p>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-cardinal-angle')}
						name="cardinalAngle"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.cardinalAngle}
						error={errors.cardinalAngle}
						isInvalid={errors.cardinalAngle}
						onChange={handleChange}
						min={0}
						max={90}
					/>

					<FormControl
						type="number"
						label={t('AddonsConfig:analog-to-dpad-direction-stickyness')}
						name="directionStickyness"
						className="form-select-sm"
						groupClassName="col-sm-3 mb-3"
						value={values.directionStickyness}
						error={errors.directionStickyness}
						isInvalid={errors.directionStickyness}
						onChange={handleChange}
						min={0}
						max={90}
					/>
				</Row>
			</div>
			<FormCheck
				label={t('Common:switch-enabled')}
				type="switch"
				id="AnalogToDpadInputButton"
				reverse={true}
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

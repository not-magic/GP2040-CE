#include "addons/analog_to_dpad.h"
#include "drivermanager.h"
#include "storagemanager.h"
#include "helper.h"
#include "config.pb.h"
#include <cmath>
#include <algorithm>

/**
 * The goal for this add-on is to provide flexible mapping from an analog stick to the D-pad, and allow switching between them.
 */

bool AnalogToDpadAddon::available() {
	const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;
	return options.enabled;
}

void AnalogToDpadAddon::reinit() {
	_enablePinMask = 0;
	_4wayPinMask = 0;

	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
	for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++)
	{
		switch (pinMappings[pin].action) {
		case GpioAction::SUSTAIN_ANALOG_TO_DPAD:
			_enablePinMask |= 1 << pin;
			break;

		case GpioAction::SUSTAIN_4_8_WAY_MODE:
			_4wayPinMask |= 1 << pin;
			break;

		default:
			break;
		}
	}
}

void AnalogToDpadAddon::setup() {
	const GamepadOptions& gamepad_options = Storage::getInstance().getGamepadOptions();
	_4wayMode = gamepad_options.fourWayMode;
}

void AnalogToDpadAddon::preprocess() {
}

void AnalogToDpadAddon::process()
{
	Gamepad * const gamepad = Storage::getInstance().GetGamepad();
	const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;

	auto map_axis = [](uint16_t x) {

		return float(x - GAMEPAD_JOYSTICK_MID)  / float(GAMEPAD_JOYSTICK_MAX - GAMEPAD_JOYSTICK_MID);
	};

	const bool read_left_stick = options.source == ANALOG_TO_DPAD_SOURCE_1;

	// source analog x/y values
	const float ax = map_axis(read_left_stick ? gamepad->state.lx : gamepad->state.rx);
	const float ay = map_axis(read_left_stick ? gamepad->state.ly : gamepad->state.ry);

  const Mask_t values = gamepad->debouncedGpio;
	const bool use_4way = _4wayMode || (values & _4wayPinMask) != 0;

	const float deadzone = (use_4way ? options.deadzone4 : options.deadzone8) * 0.01f;
	const float squareness = (use_4way ? options.squareness4 : options.squareness8) * 0.02f;

	// this fixes the zoom caused by squareness mapping, so the deadzone size remains constant
	const float deadzone_scale = deadzone > 0 ? (deadzone / std::pow(std::abs(deadzone), 1+squareness)) : 1.0f;

	const float x = std::pow(std::abs(ax), 1+squareness) * (ax > 0 ? 1 : -1) * deadzone_scale;
	const float y = std::pow(std::abs(ay), 1+squareness) * (ay > 0 ? 1 : -1) * deadzone_scale;

	const float debounce = (use_4way ? options.debounce4 : options.debounce8) * 0.01f;
	const float debounce_x = (_lastDpad & (GAMEPAD_MASK_LEFT|GAMEPAD_MASK_RIGHT)) != 0 ? debounce : 0;
	const float debounce_y = (_lastDpad & (GAMEPAD_MASK_UP|GAMEPAD_MASK_DOWN)) != 0 ? debounce : 0;

	int result_x = 0;
	int result_y = 0;

	if (use_4way) {

		// 4-way mode will only ever have one of these active at a time
		const float debounced_deadzone = std::max(0.f, deadzone - (debounce_x + debounce_y));

		const float dist_squared = (x*x)+(y*y);
		const float offset = options.offset4 * 0.01f;
		const float offset_x = offset - debounce_x;
		const float offset_y = offset - debounce_y;

		if (dist_squared > debounced_deadzone*debounced_deadzone && (std::abs(x) > offset_x || std::abs(y) > offset_y)) {

			// if we're in the active region we always return one value.
			// prefer the previous value on borders until the debounce window has been exceeded, to prevent rapid direction changes

			if (std::abs(x)+debounce_x > std::abs(y)+debounce_y) {

				result_x = x > 0 ? 1 : -1;

			} else {

				result_y = y > 0 ? 1 : -1;
			}
		}

	} else {

		const float slope = options.slope8 * 0.01f;

		auto calc_cardinal = [slope](float value, float other_axis_value, float deadzone, float offset) {

			const float dist_squared = (value*value)+(other_axis_value*other_axis_value);
			if (dist_squared < deadzone*deadzone) {
				return 0;
			}

			if (value > offset) {

				if (std::abs(other_axis_value/(value-offset))*slope < 1) {
					return 1;
				}
			} else if (value < -offset) {
				if (std::abs(other_axis_value/(value+offset))*slope < 1) {
					return -1;
				}
			}

			return 0;
		};

		const float offset = options.offset8 * 0.01f;

		result_x = calc_cardinal(x, y, std::max(0.f, deadzone - debounce_x), offset - debounce_x);
		result_y = calc_cardinal(y, x, std::max(0.f, deadzone - debounce_y), offset - debounce_y);
	}

	_lastDpad = 0
		| (result_x == 1 ? GAMEPAD_MASK_RIGHT : 0)
		| (result_x == -1 ? GAMEPAD_MASK_LEFT : 0)
		| (result_y == 1 ? GAMEPAD_MASK_DOWN : 0)
		| (result_y == -1 ? GAMEPAD_MASK_UP : 0);

	if (_enablePinMask == 0 || (values & _enablePinMask) != 0) {
		gamepad->state.dpad = _lastDpad;

		// clear the joystick we read from
		if (read_left_stick) {
			gamepad->state.lx = GAMEPAD_JOYSTICK_MID;
			gamepad->state.ly = GAMEPAD_JOYSTICK_MID;

		} else {
			gamepad->state.rx = GAMEPAD_JOYSTICK_MID;
			gamepad->state.ry = GAMEPAD_JOYSTICK_MID;

		}
	}
}

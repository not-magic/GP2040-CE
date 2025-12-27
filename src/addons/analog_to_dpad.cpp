#include "addons/analog_to_dpad.h"
#include "drivermanager.h"
#include "storagemanager.h"
#include "helper.h"
#include "config.pb.h"
#include <cmath>
#include <algorithm>

/**
 * The goal for this add-on is to provide flexible mapping from an analog stick to a digital output
 * 
 */

// returns -1, 0, 1 for the axis. Uses the other axis to calcualate a slope value
int8_t AnalogToDpad::calc_cardinal(float value, float other_axis_value, float debounce) const {

	const float near_deadzone = _deadzone-debounce;
	const float dist_squared = (value*value)+(other_axis_value*other_axis_value);
	if (dist_squared < near_deadzone*near_deadzone) {
		return 0;
	}

	const float offset = _offset-debounce;

	if (value > offset) {
		if (std::abs(other_axis_value/(value-offset))*_slope < 1) {
			return 1;
		}
	} else if (value < -offset) {
		if (std::abs(other_axis_value/(value+offset))*_slope < 1) {
			return -1;
		}
	}

	return 0;	
}

bool AnalogToDpad::available() {
    const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;
    return options.enabled;
}

void AnalogToDpad::setup() {

    const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;

    _squareness = options.squareness;
	_deadzone = options.deadzone;
	_slope = options.slope;
	_offset = options.offset;
	_debounce = options.debounce;

	mapAnalogToDpad = nullptr;

	GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
	for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++)
	{
		switch (pinMappings[pin].action) {
			case GpioAction::SUSTAIN_ANALOG_TO_DPAD: {
				mapAnalogToDpad = new GamepadButtonMapping(0);
				mapAnalogToDpad->pinMask |= 1 << pin;
				break;
			}

			default:    break;
		}
	}
}

void AnalogToDpad::preprocess()
{
}

void AnalogToDpad::process()
{
	Gamepad * gamepad = Storage::getInstance().GetGamepad();

	auto map_axis = [](uint16_t x) {

	    return float(x - GAMEPAD_JOYSTICK_MID)  / float(GAMEPAD_JOYSTICK_MAX - GAMEPAD_JOYSTICK_MID);
	};

	const float ax = map_axis(gamepad->state.lx);
	const float ay = map_axis(gamepad->state.ly);

	const float x = std::pow(std::abs(ax), 1+_squareness) * (x > 0 ? 1 : -1);
	const float y = std::pow(std::abs(ay), 1+_squareness) * (y > 0 ? 1 : -1);

	const int8_t result_x = calc_cardinal(x, y, (_lastDpad & (GAMEPAD_MASK_LEFT|GAMEPAD_MASK_RIGHT)) != 0 ? _debounce : 0);
	const int8_t result_y = calc_cardinal(y, x, (_lastDpad & (GAMEPAD_MASK_UP|GAMEPAD_MASK_DOWN)) != 0 ? _debounce : 0);

	_lastDpad = 0
		| (result_x == 1 ? GAMEPAD_MASK_RIGHT : 0)
		| (result_x == -1 ? GAMEPAD_MASK_LEFT : 0)
		| (result_y == 1 ? GAMEPAD_MASK_UP : 0)
		| (result_y == -1 ? GAMEPAD_MASK_DOWN : 0);

    Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;

	if (mapAnalogToDpad == nullptr || values & mapAnalogToDpad->pinMask) {
		gamepad->state.dpad = _lastDpad;
		gamepad->state.lx = GAMEPAD_JOYSTICK_MID;
		gamepad->state.ly = GAMEPAD_JOYSTICK_MID;
	}
}

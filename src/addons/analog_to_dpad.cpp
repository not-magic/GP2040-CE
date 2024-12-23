#include "addons/analog_to_dpad.h"
#include "drivermanager.h"
#include "storagemanager.h"
#include "helper.h"
#include "config.pb.h"
#include <cmath>
#include <algorithm>

static uint8_t find_dpad_mask(float x, float y, float cangle) {

	if (y < -cangle) {
		return GAMEPAD_MASK_UP;
	} else if (y > cangle) {
		return GAMEPAD_MASK_DOWN;
	}

	if (x < -cangle) {
		return GAMEPAD_MASK_LEFT;
	} else if (x > cangle) {
		return GAMEPAD_MASK_RIGHT;
	}

	return ((y < 0) ? GAMEPAD_MASK_UP : GAMEPAD_MASK_DOWN) | ((x < 0) ? GAMEPAD_MASK_LEFT : GAMEPAD_MASK_RIGHT);
}

bool AnalogToDpad::available() {
    const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;
    return options.enabled;
}

void AnalogToDpad::setup() {

    const AnalogToDpadOptions& options = Storage::getInstance().getAddonOptions().analogToDpadOptions;

	_cardinalAngle = std::cos((float(options.cardinalAngle)/2) * M_PI/180.f);
	_stickyCardinalAngle = std::cos((float(options.cardinalAngle - options.directionStickyness)/2) * M_PI/180.f);
	_baseDeadzone = options.deadzone * 0.01f;
	_dynamicDeadzone = options.enableDynamicDeadzone ? (options.dynamicDeadzone * 0.01f) : 1.0f;

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

	float ax = map_axis(gamepad->state.lx);
	float ay = map_axis(gamepad->state.ly);

	float analog_len = std::sqrt(ax*ax + ay*ay);

	uint8_t new_dpad_mask = 0;

	float use_deadzone = _deadzone - (_lastDpad ? 0.05 : 0);

	// magic debounce values
	if (analog_len > _deadzone) {
		// normalize this
		ax /= analog_len;
		ay /= analog_len;

		analog_len = std::min<float>(1.f, analog_len);

		switch (_lastDpad) {

		case 0:
		case GAMEPAD_MASK_LEFT:
		case GAMEPAD_MASK_RIGHT:
		case GAMEPAD_MASK_DOWN:
		case GAMEPAD_MASK_UP: {
				new_dpad_mask = find_dpad_mask(ax, ay, _cardinalAngle);
			}
			break;

		default: {
				new_dpad_mask = find_dpad_mask(ax, ay, _stickyCardinalAngle);
			}
		}

		if (_lastDpad == new_dpad_mask) {
			_deadzone = std::max<float>(_deadzone, analog_len - _dynamicDeadzone);
			_deadzone = std::min<float>(_deadzone, analog_len + _dynamicDeadzone);
		} else {
			_deadzone = _baseDeadzone + 0.01;
		}

		if (analog_len > _deadzone) {
			_lastDpad = new_dpad_mask;
		}

	} else {

		_lastDpad = 0;
	}

    Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;

	if (mapAnalogToDpad == nullptr || values & mapAnalogToDpad->pinMask) {
		gamepad->state.dpad = _lastDpad;
		gamepad->state.lx = GAMEPAD_JOYSTICK_MID;
		gamepad->state.ly = GAMEPAD_JOYSTICK_MID;
	}
}

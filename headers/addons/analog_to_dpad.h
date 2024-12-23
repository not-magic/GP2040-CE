#ifndef _AnalogToDpad_H
#define _AnalogToDpad_H

#include "gpaddon.h"

#include "GamepadEnums.h"

#ifndef ANALOG_TO_DPAD_ENABLED
#define ANALOG_TO_DPAD_ENABLED 0
#endif

#ifndef ANALOG_TO_DPAD_DEADZONE
#define ANALOG_TO_DPAD_DEADZONE 30
#endif

#ifndef ANALOG_TO_DPAD_DYNAMIC_DEADZONE
#define ANALOG_TO_DPAD_DYNAMIC_DEADZONE 40
#endif

#ifndef ANALOG_TO_DPAD_DYNAMIC_DEADZONE_ENABLED
#define ANALOG_TO_DPAD_DYNAMIC_DEADZONE_ENABLED false
#endif

#ifndef ANALOG_TO_DPAD_CARDINAL_ANGLE
#define ANALOG_TO_DPAD_CARDINAL_ANGLE 50
#endif

#ifndef ANALOG_TO_DPAD_DIRECTION_STICKYNESS
#define ANALOG_TO_DPAD_DIRECTION_STICKYNESS 10
#endif


class AnalogToDpad : public GPAddon {
public:
	virtual std::string name() { return "Analog To D-pad"; }

	bool available() override;
	void setup() override;
	void process() override;
	void preprocess() override;
private:

	// options
	float _cardinalAngle = 0.866025404f; // cos (60/2)
	float _stickyCardinalAngle = 0.923879533f; // cos (45/2)
	float _baseDeadzone = ANALOG_TO_DPAD_DEADZONE / 100.f;
	float _dynamicDeadzone = ANALOG_TO_DPAD_DYNAMIC_DEADZONE / 100;

	float _deadzone = ANALOG_TO_DPAD_DEADZONE / 100.f;
	uint8_t _lastDpad = 0;

	GamepadButtonMapping *mapAnalogToDpad = nullptr;
};

#endif  // _AnalogToDpad_H

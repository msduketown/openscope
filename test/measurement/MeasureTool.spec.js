import ava from 'ava';

import {
    createAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import MeasureTool from '../../src/assets/scripts/client/measurement/MeasureTool';
import FixCollection from '../../src/assets/scripts/client/navigationLibrary/FixCollection';
import MeasureLegModel from '../../src/assets/scripts/client/measurement/MeasureLegModel';
import { MEASURE_TOOL_STYLE } from '../../src/assets/scripts/client/constants/inputConstants';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../aircraft/_mocks/aircraftMocks';

const CURSOR_POSITION = [500, 20];

function createAircaft() {
    return new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
}

ava.before(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.beforeEach(() => {
    MeasureTool.reset();
});

ava.serial('.addPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.addPoint(CURSOR_POSITION));
});

ava.serial('.removeLastPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.removeLastPoint());
});

ava.serial('.updateLastPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('.addPoint() throws when point value is invalid', (t) => {
    MeasureTool.startNewPath();

    t.throws(() => MeasureTool.addPoint({}));
    t.throws(() => MeasureTool.addPoint(null));
    t.notThrows(() => MeasureTool.addPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.addPoint(CURSOR_POSITION));
});

ava.serial('.updateLastPoint() throws when point value is invalid', (t) => {
    MeasureTool.startNewPath();

    t.throws(() => MeasureTool.updateLastPoint({}));
    t.throws(() => MeasureTool.updateLastPoint(null));
    t.notThrows(() => MeasureTool.updateLastPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('.addPoint() sets the correct flags', (t) => {
    MeasureTool.startNewPath();

    t.true(MeasureTool.isMeasuring);
    t.false(MeasureTool.hasStarted);

    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));

    t.true(MeasureTool.isMeasuring);
    t.true(MeasureTool.hasStarted);

    MeasureTool.endPath();

    t.false(MeasureTool.isMeasuring);
    t.false(MeasureTool.hasStarted);
});

ava.serial('.reset() clears the flags to their initial state', (t) => {
    MeasureTool.startNewPath();
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.endPath();
    MeasureTool.reset();

    t.is(MeasureTool.hasStarted, false);
    t.is(MeasureTool.isMeasuring, false);
});

ava.serial('.buildPathInfo() returns an empty array when there are no valid legs', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.endPath();

    const pathInfo = MeasureTool.buildPathInfo();

    t.deepEqual(pathInfo, []);
});

ava.serial('.buildPathInfo() builds a correct MeasureLegModel from FixModel points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const dbige = FixCollection.findFixByName('DBIGE');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(dbige);
    MeasureTool.endPath();

    const [pathInfo] = MeasureTool.buildPathInfo();
    const { initialTurn, firstLeg } = pathInfo;
    const leg1 = firstLeg.next;

    t.is(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.is(firstLeg.previous, null);
    t.is(firstLeg.startPoint, null);
    t.is(leg1.next, null);

    t.deepEqual(leg1.startPoint, bakrr.relativePosition);
    t.deepEqual(leg1.endPoint, dbige.relativePosition);
    t.not(leg1.midPoint, null);
    t.not(leg1.bearing, 0);
    t.not(leg1.distance, 0);
    t.is(leg1.labels.length, 1);
    t.is(leg1.radius, 0);
});

ava.serial('.buildPathInfo() builds a correct MeasureLegModel from mixed points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const aircraft = createAircaft();
    aircraft.groundSpeed = 180;

    MeasureTool.startNewPath();
    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ALL_ARCED);
    MeasureTool.addPoint(aircraft);
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(CURSOR_POSITION);
    MeasureTool.endPath();

    const [pathInfo] = MeasureTool.buildPathInfo();
    const { initialTurn, firstLeg } = pathInfo;
    const leg1 = firstLeg.next;
    const leg2 = leg1.next;

    t.not(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.is(firstLeg.previous, null);
    t.is(leg2.next, null);

    t.not(initialTurn.turnRadius, 0);
    t.not(leg1.radius, 0);
    t.is(leg2.radius, 0);
});

ava.serial('.removeLastPoint() removes a point as expected', (t) => {
    MeasureTool.startNewPath();
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.addPoint(CURSOR_POSITION);

    t.is(MeasureTool._currentPath._points.length, 3);

    MeasureTool.removeLastPoint();
    t.is(MeasureTool._currentPath._points.length, 2);

    MeasureTool.removeLastPoint();
    t.is(MeasureTool._currentPath._points.length, 2);
});

ava.serial('.setStyle() correctly sets the _style property', (t) => {
    MeasureTool.setStyle(MEASURE_TOOL_STYLE.STRAIGHT);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.STRAIGHT);

    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ARC_TO_NEXT);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.ARC_TO_NEXT);

    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ALL_ARCED);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.ALL_ARCED);

    MeasureTool.setStyle('a random value');
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.STRAIGHT);
});

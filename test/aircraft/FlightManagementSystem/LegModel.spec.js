import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';

import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';

const directRouteSegmentMock = 'COWBY';
const procedureRouteSegmentMock = 'DAG.KEPEC3.KLAS';
const runwayMock = '19L';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new LegModel());
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture));
});

ava('#currentWaypoint returns the first item in #waypointCollection', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture);

    t.true(_isEqual(model.waypointCollection[0], model.currentWaypoint));
});

ava('.init() calls ._buildWaypointCollection()', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const _buildWaypointCollectionSpy = sinon.spy(model, '_buildWaypointCollection');

    model.init(procedureRouteSegmentMock);

    t.true(_buildWaypointCollectionSpy.calledWithExactly(procedureRouteSegmentMock));
});

ava('._buildWaypointForDirectRoute() returns an instance of a WaypointModel', (t) => {
    const model = new LegModel(directRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const result = model._buildWaypointForDirectRoute(directRouteSegmentMock);

    console.log(result);

    t.true(_isArray(result));
    t.true(result[0] instanceof WaypointModel);
    t.true(result[0].name === 'COWBY');
});

ava('._buildWaypointCollectionForProcedureRoute() returns a list of StandardRouteWaypointModels', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const result = model._buildWaypointCollectionForProcedureRoute(procedureRouteSegmentMock);

    t.plan(result.length);
    for (let i = 0; i < result.length; i++) {
        t.true(result[i] instanceof StandardRouteWaypointModel);
    }
});

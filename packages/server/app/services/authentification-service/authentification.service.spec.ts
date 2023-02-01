import { ServicesTestingUnit } from '@app/services/service-testing-unit/services-testing-unit.spec';
import * as chai from 'chai';
import { Container } from 'typedi';
import { AuthentificationService } from './authentification.service';

const expect = chai.expect;

describe('AuthentificationService', () => {
    let testingUnit: ServicesTestingUnit;
    let authentificationService: AuthentificationService;

    beforeEach(async () => {
        testingUnit = new ServicesTestingUnit();
        await testingUnit.withMockDatabaseService();
    });

    beforeEach(() => {
        authentificationService = Container.get(AuthentificationService);
    });

    afterEach(() => {
        testingUnit.restore();
    });

    it('should be defined', () => {
        expect(authentificationService);
    });
});

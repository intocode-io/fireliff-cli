import Axios from 'axios';
import { LIFFGetRequest } from '../lib/liff-get-request';

describe('LIFFGetRequest', () => {

    describe('when create an instance with options.accessToken', () => {
        let req;
        let accessToken = 'someaccesstoken';

        beforeAll(() => {
            jest.spyOn(Axios, 'create');
            req = new LIFFGetRequest({ accessToken });
        });

        it('should have correct endpoint', () => {
            expect(req.endpoint).toEqual('https://api.line.me/liff/v1/apps');
        });

        it('should create axios instance with correct headers for LINE API', () => {
            expect(Axios.create).toHaveBeenCalledWith({
                headers: {
                    'authorization': `Bearer ${accessToken}`,
                    'content-type': 'application/json'
                }
            });
            expect(req.axios).toBeDefined();
        });

        describe('when send a request', () => {
            beforeAll(() => {
                jest.spyOn(req.axios, 'get').mockResolvedValue('any');
                req.send();
            });
            it('should call to correct endpoint', () => {
                expect(req.axios.get).toHaveBeenCalledTimes(1);
                expect(req.axios.get).toHaveBeenCalledWith(req.endpoint);
            });
            afterAll(() => {
                req.axios.get.mockRestore();
            });
        });

        afterAll(() => {
            Axios.create.mockRestore();
        });

    });

});

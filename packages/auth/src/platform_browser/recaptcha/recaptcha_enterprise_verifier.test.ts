/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Endpoint, RecaptchaClientType, RecaptchaVersion } from '../../api';
import { mockEndpointWithParams } from '../../../test/helpers/api/helper';
import { testAuth, TestAuth } from '../../../test/helpers/mock_auth';
import * as mockFetch from '../../../test/helpers/mock_fetch';
import { ServerError } from '../../api/errors';

import { MockGreCAPTCHATopLevel } from './recaptcha_mock';
import { RecaptchaEnterpriseVerifier } from './recaptcha_enterprise_verifier';

use(chaiAsPromised);
use(sinonChai);

describe('platform_browser/recaptcha/recaptcha_enterprise_verifier', () => {
  let auth: TestAuth;
  let verifier: RecaptchaEnterpriseVerifier;

  beforeEach(async () => {
    auth = await testAuth();
    mockFetch.setUp();
    verifier = new RecaptchaEnterpriseVerifier(auth);
  });

  afterEach(() => {
    mockFetch.tearDown();
    sinon.restore();
  });

  context('#verify', () => {
    const request = {
      clientType: RecaptchaClientType.WEB,
      version: RecaptchaVersion.ENTERPRISE
    };

    let recaptcha: MockGreCAPTCHATopLevel;
    beforeEach(() => {
      recaptcha = new MockGreCAPTCHATopLevel();
      window.grecaptcha = recaptcha;
    });

    it('returns if response is available', async () => {
      mockEndpointWithParams(Endpoint.GET_RECAPTCHA_CONFIG, request, {
        recaptchaKey: 'site-key'
      });
      sinon
        .stub(recaptcha.enterprise, 'execute')
        .returns(Promise.resolve('recaptcha-response'));
      expect(await verifier.verify()).to.eq('recaptcha-response');
    });

    it('reject if error is thrown when retieve site key', async () => {
      mockEndpointWithParams(
        Endpoint.GET_RECAPTCHA_CONFIG,
        request,
        {
          error: {
            code: 400,
            message: ServerError.UNAUTHORIZED_DOMAIN // TODO(chuanr): change to new recaptcha error
          }
        },
        400
      );
      sinon
        .stub(recaptcha.enterprise, 'execute')
        .returns(Promise.resolve('recaptcha-response'));
      await expect(verifier.verify()).to.be.rejectedWith(
        Error,
        'auth/unauthorized-continue-uri'
      );
    });

    it('reject if error is thrown when retieve recaptcha token', async () => {
      mockEndpointWithParams(Endpoint.GET_RECAPTCHA_CONFIG, request, {
        recaptchaKey: 'site-key'
      });
      sinon
        .stub(recaptcha.enterprise, 'execute')
        .returns(Promise.reject(Error('retieve-recaptcha-token-error')));
      await expect(verifier.verify()).to.be.rejectedWith(
        Error,
        'retieve-recaptcha-token-error'
      );
    });
  });
});

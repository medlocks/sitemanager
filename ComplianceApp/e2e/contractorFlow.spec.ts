import { device, element, by, expect } from 'detox';

describe('Contractor Automated Compliance Suite', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to profile through the quick row', async () => {
    await element(by.id('btn-profile')).tap();
    await expect(element(by.text('VERIFICATION STATUS'))).toBeVisible();
    await expect(element(by.text('EXPORT MY DATA (JSON)'))).toBeVisible();
  });

  it('should complete a statutory sign-off flow', async () => {
    await expect(element(by.id('sign-off-btn-0'))).toBeVisible();
    await element(by.id('sign-off-btn-0')).tap();

    await element(by.id('input-signature')).typeText('John Contractor');
    await element(by.id('input-notes')).typeText('Routine statutory maintenance completed.');
    await element(by.id('input-remedial')).typeText('None required.');

    await element(by.id('btn-submit-resolution')).tap();

    await expect(element(by.text('Success'))).toBeVisible();
    await element(by.text('OK')).tap();
  });
});
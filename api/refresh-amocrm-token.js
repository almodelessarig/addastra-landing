// Vercel Serverless Function для обновления amoCRM токена
export default async function handler(req, res) {
  // Настройки amoCRM OAuth
  const AMOCRM_SUBDOMAIN = 'addastra';
  const INTEGRATION_ID = '21e1d711-c2fa-4424-a4c7-5234ba247be2';
  const SECRET_KEY = 'x3J3eYyILwsk48Le7lerS5T8pu4AwYSuqcqXc1K9D2TIwZ8RGrKSI5DdMaVCDx3R';
  const REFRESH_TOKEN = 'def502007fbe857b02ff70d67f90207d67f02d133c5a31bd18d0dbda385b09a872317776735988587dd0965216f00debf7fdb7c20d9ef4d32152c838b0bb4d60a3198daf2b071dccb2ff8b7e75b15ab2a5e679c436431b7282840c95e9651a8674c4034725c89eb7e8f63fb0dc4ee5cf5a2991f3c2f0816e95c5352498e68cd0a45b27a92c883ab3c31be452093fbaefcdd79a3439bbad594fc47c876b6c3b26fe209c076da6d9b7b270cbed1b2f92467bf0d50342c1bfb83549657c9f6cb5b3bd82213388eb6eb65c33ad7328d41375171526f2d2ba1c9d4577641545bd1cde728e59644431012b77e7801e591af311db805ea03222c00d38565c8c6e2b882c3af4f66da9da0482d36d4bb3fbd949a240730880e53ae0893a91dd790ed413a7511c05795aaff1e136f4fbbe41b789aed3585ddcc4fc33923ec313b55b85e0a0ff8e5a5aa3b312eb68aaf5620b719675141602d80cb674c1eb80298bbe8fc50faeb5a4306203c732b7f75d73700cf7da091178be4de1a33defa29b4ce40d65aaa393d903bf804ece36fed3d9f88be3eab1401397d1a20c814fbaf68b1738f11abd71861620c0a3ff5dd975048b8d7d44f9cfd608c6f295d0d9b9506133cd288798fa7e5c560c49773c92b6b2a66c19daff333ddd4f5572e366fee024b26ff6d7cf9e3754434c4464eaae1cba9af0';
  const REDIRECT_URI = 'https://addastra-law.kz';

  try {
    const tokenUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: INTEGRATION_ID,
        client_secret: SECRET_KEY,
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();

    if (data.access_token) {
      res.status(200).json({
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        message: 'Токен успешно обновлен!'
      });
    } else {
      console.error('Token refresh error:', data);
      res.status(500).json({
        success: false,
        message: 'Ошибка обновления токена',
        error: data
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
}

document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const responseMessage = document.getElementById('responseMessage');

  const recaptchaResponse = grecaptcha.getResponse();

  if (!recaptchaResponse) {
    responseMessage.textContent = '「私はロボットではありません」にチェックを入れてください。';
    return;
  }
  
  submitBtn.disabled = true;
  responseMessage.textContent = '送信中...';
  
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyrT2_OUlMTE1yBjsnaIQBov-z3RAaywrGQCsCGTCJ1KCBSmlYvEjDVCB_eET631njUXw/exec'; 
  
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
    recaptchaToken: recaptchaResponse
  };
  
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.result === 'success') {
      responseMessage.textContent = 'お問い合わせを送信しました。';
      document.getElementById('contactForm').reset();
      grecaptcha.reset();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error(error);
    responseMessage.textContent = 'エラーが発生しました。お手数ですが、時間をおいて再度お試しください。';
    grecaptcha.reset();
  } finally {
    submitBtn.disabled = false;
  }
});

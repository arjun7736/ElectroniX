// move into next box
function moveToNext(currentInput, nextInputId) {
  const maxLength = parseInt(currentInput.getAttribute('maxlength'));

  if (currentInput.value.length === maxLength) {
    const nextInput = document.getElementById(nextInputId);

    if (nextInput) {
      nextInput.focus();
    }
  }
}



// otp resend button
function hideAndCountdown() {
  const hideButton = document.getElementById('hideButton');
  const countdownElement = document.getElementById('countdown');
  hideButton.style.display = 'none';
  countdownElement.classList.remove('hidden');
  let countdownTime = 30;
  function updateCountdown() {
    countdownElement.innerHTML = `Wait ${countdownTime}s`;
    countdownTime--;
    if (countdownTime < 0) {
      hideButton.style.display = 'inline-block';
      countdownElement.classList.add('hidden');
      clearInterval(countdownInterval);
    }
  }
  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}


// Product image change
function changeMainImage(clickedImage) {
  const mainImage = document.getElementById('main').querySelector('img');
  mainImage.src = clickedImage.src;
}

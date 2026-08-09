// Мобильное меню
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  // Отправка формы заявки через Web3Forms (без своего бэкенда)
  document.querySelectorAll("form[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector("button[type=submit]");
      var successBox = form.parentElement.querySelector(".form-success");
      var formData = new FormData(form);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляем…";
      }

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.success) {
            if (successBox) {
              successBox.classList.add("show");
              successBox.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            form.reset();
          } else {
            alert("Не удалось отправить заявку. Попробуйте ещё раз или напишите на почту напрямую.");
          }
        })
        .catch(function () {
          alert("Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Отправить заявку";
          }
        });
    });
  });
});

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

  // Выпадающее меню "Каталог материалов"
  document.querySelectorAll(".nav-drop__toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var drop = btn.closest(".nav-drop");
      var wasOpen = drop.classList.contains("open");
      document.querySelectorAll(".nav-drop.open").forEach(function (d) { d.classList.remove("open"); });
      if (!wasOpen) drop.classList.add("open");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-drop")) {
      document.querySelectorAll(".nav-drop.open").forEach(function (d) { d.classList.remove("open"); });
    }
  });

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
        body: formData
      })
        .then(function (response) {
          if (response.ok) {
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

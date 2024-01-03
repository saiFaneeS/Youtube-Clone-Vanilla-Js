const currentCategory = new URLSearchParams(window.location.search).get(
  "category"
);

const menuBtns = document.querySelectorAll(".menu-svg-container");

menuBtns.forEach((btn) => {
  btn.addEventListener("click", toggleSidebar);
});

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar.style.display === "block") {
    sidebar.style.display = "none";
  } else if (sidebar.style.display === "none") {
    sidebar.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.querySelector("header");
  navbar.style.backgroundColor = "transparent";

  window.addEventListener("scroll", function () {
    if (window.scrollY > 0) {
      navbar.style.backgroundColor = "#0f0f0f";
    } else {
      navbar.style.backgroundColor = "transparent";
    }
  });
});

const sidebar = document.querySelector(".sidebar");

window.addEventListener("DOMContentLoaded", () => {
  sidebar.style.display = "none";
});

const sideLinks = document.querySelectorAll(".sidebar ul li");

const activeLink = Array.from(sideLinks).find((li) => {
  return (
    li.textContent.toLowerCase().trim() ===
    currentCategory?.toLowerCase().trim()
  );
});

if (activeLink) {
  activeLink.classList.add("active");

  Array.from(sideLinks).forEach((li) => {
    if (li !== activeLink) {
      li.classList.remove("active");
    }
  });
}

sideLinks.forEach((li) => {
  li.addEventListener("click", () => {
    console.log(li.textContent.trim());
    if (
      li.textContent?.toLocaleLowerCase().trim() !==
      currentCategory?.toLowerCase().trim()
    ) {
      window.location.href = `./index.html?category=${encodeURIComponent(
        li.textContent.toLocaleLowerCase().trim()
      )}`;
    } else if (li.textContent?.toLocaleLowerCase().trim() === "home") {
      window.location.href = `./index.html`;
    }
  });
});

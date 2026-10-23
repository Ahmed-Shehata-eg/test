const stageSelect = document.querySelector("#stage");
const gradeSelect = document.querySelector("#grade");
const dialog = document.querySelector(".enroll-dialog");
const form = document.querySelector("#enrollment-form");
const result = document.querySelector("#form-result");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");

const gradesByStage = {
	primary: ["الأول الابتدائي", "الثاني الابتدائي", "الثالث الابتدائي", "الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي"],
	prep: ["الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي"],
	secondary: ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"]
};

document.documentElement.classList.add("js-ready");

document.querySelectorAll(".track-card, .method-step, .payment-panel, .faq-list details").forEach((element) => {
	element.setAttribute("data-reveal", "");
});

if ("IntersectionObserver" in window) {
	const revealObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.12 });

	document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
} else {
	document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
}

function updateGrades(stage) {
	gradeSelect.replaceChildren(new Option("اختار الصف", ""));
	(gradesByStage[stage] || []).forEach((grade) => gradeSelect.add(new Option(grade, grade)));
	gradeSelect.disabled = !gradesByStage[stage];
}

function openEnrollment(stage = "") {
	form.reset();
	result.hidden = true;
	result.replaceChildren();
	stageSelect.value = stage;
	updateGrades(stage);
	if (typeof dialog.showModal === "function") dialog.showModal();
}

document.querySelectorAll(".enroll-trigger").forEach((button) => {
	button.addEventListener("click", () => openEnrollment(button.dataset.stage || ""));
});

stageSelect.addEventListener("change", () => updateGrades(stageSelect.value));

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
	if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", (event) => {
	event.preventDefault();
	if (!form.reportValidity()) return;

	const formData = new FormData(form);
	const studentName = formData.get("studentName").trim();
	const grade = formData.get("grade");
	result.replaceChildren();

	const heading = document.createElement("strong");
	heading.textContent = `طلب ${studentName} جاهز للمعاينة`;
	const summary = document.createElement("p");
	summary.textContent = `${grade} · ${formData.get("phone")} · الدفع داخل مصر فقط. لم يتم إرسال البيانات أو تنفيذ دفع.`;
	result.append(heading, summary);
	result.hidden = false;
});

menuToggle.addEventListener("click", () => {
	const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
	menuToggle.setAttribute("aria-expanded", String(!isOpen));
	mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => {
		menuToggle.setAttribute("aria-expanded", "false");
		mainNav.classList.remove("is-open");
	});
});

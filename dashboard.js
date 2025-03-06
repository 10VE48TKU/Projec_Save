document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM Loaded, Initializing data...");
    
    // โหลดข้อมูลเริ่มต้นจากค่าเก็บไว้ (ถ้ามี)
    const storedType = localStorage.getItem("selectedType") || "dormitory_type";
    document.getElementById("dataSelect").value = storedType;
    loadData(storedType);

    // ดักจับ event เมื่อมีการเลือกประเภทข้อมูล
    document.getElementById("dataSelect").addEventListener("change", function () {
        localStorage.setItem("selectedType", this.value); // เก็บค่าเลือกไว้
        loadData(this.value);
    });

    // ดักจับ event ปุ่มเพิ่ม
    document.getElementById("addButton").addEventListener("click", function () {
        navigateToAddPage();
    });
});

// ✅ ฟังก์ชันโหลดข้อมูลตามประเภทที่เลือก
async function loadData(type) {
    let apiUrl = "http://localhost:3000/dashboard_data"; // ✅ ใช้ API เดียวสำหรับทุกหมวด
    let titleText = "";

    switch (type) {
        case "dormitory_type":
            titleText = "จัดการประเภทหอพัก";
            break;
        case "dormitory_category":
            titleText = "จัดการหมวดหมู่หอพัก";
            break;
        case "facility":
            titleText = "จัดการสิ่งอำนวยความสะดวก";
            break;
        default:
            console.error("❌ ไม่พบประเภทข้อมูลที่เลือก");
            return;
    }

    document.getElementById("pageTitle").innerText = titleText;

    try {
        let response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        let data = await response.json();
        console.log(`📌 ข้อมูลจาก API (${type}):`, data);

        if (type === "dormitory_type") {
            renderTable(data.types, type);
        } else if (type === "dormitory_category") {
            renderTable(data.categories, type);
        } else if (type === "facility") {
            renderTable(data.facilities, type);
        }
    } catch (error) {
        console.error("❌ Error loading data:", error);
        document.getElementById("dataTable").innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">❌ โหลดข้อมูลล้มเหลว</td></tr>`;
    }
}

// ✅ ฟังก์ชันแสดงข้อมูลในตาราง (ลบคอลัมน์ "สถานะ" ออก)
function renderTable(data, type) {
    let tableBody = document.getElementById("dataTable");
    tableBody.innerHTML = "";

    if (!data || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">❌ ไม่มีข้อมูล</td></tr>`;
        return;
    }

    data.forEach((row) => {
        const rowElement = document.createElement("tr");
        let id = row.Dormitory_Type_ID || row.Category_ID || row.Facility_ID;
        let name = row.Dormitory_Type || row.Category_Name || row.Facility_Name;

        rowElement.innerHTML = `
            <td>${id}</td>
            <td>${name}</td>
            <td>
                <a href="${getEditPage(type)}?id=${id}" class="btn-edit" onclick="storeTypeBeforeNavigation()">แก้ไข</a>
                <button class="btn-toggle ${row.Status}" 
                        onclick="toggleStatus(${id}, '${type}')">
                    ${row.Status === "enable" ? "Disable" : "Enable"}
                </button>
            </td>
        `;
        tableBody.appendChild(rowElement);
    });
}

// ✅ ฟังก์ชันเปลี่ยนสถานะข้อมูล
async function toggleStatus(id, type) {
    try {
        let response = await fetch(`http://localhost:3000/toggle_status/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: type })
        });

        let data = await response.json();
        alert(data.message);

        // รีโหลดข้อมูลอัตโนมัติหลังเปลี่ยนค่า
        loadData(type);
    } catch (error) {
        console.error("❌ Error toggling status:", error);
        alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ!");
    }
}

// ✅ ฟังก์ชันเปลี่ยนหน้าไปยังหน้าสำหรับเพิ่มข้อมูล
function navigateToAddPage() {
    const type = document.getElementById("dataSelect").value;
    let addPage = "";

    switch (type) {
        case "dormitory_type":
            addPage = "add.html";
            break;
        case "dormitory_category":
            addPage = "add_category.html";
            break;
        case "facility":
            addPage = "add_facility.html";
            break;
        default:
            alert("❌ ไม่สามารถเพิ่มข้อมูลได้!");
            return;
    }

    localStorage.setItem("selectedType", type); // ✅ เก็บค่าไว้ก่อนเปลี่ยนหน้า
    window.location.href = addPage;
}

// ✅ ฟังก์ชันคืนค่า URL ของหน้าที่ใช้แก้ไขข้อมูล
function getEditPage(type) {
    switch (type) {
        case "dormitory_type":
            return "edit.html";
        case "dormitory_category":
            return "edit_category.html";
        case "facility":
            return "edit_facility.html";
        default:
            return "#";
    }
}

// ✅ ฟังก์ชันเก็บค่าก่อนเปลี่ยนหน้า (ใช้ในปุ่ม "แก้ไข")
function storeTypeBeforeNavigation() {
    const type = document.getElementById("dataSelect").value;
    localStorage.setItem("selectedType", type);
}

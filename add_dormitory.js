document.addEventListener("DOMContentLoaded", async () => {
    const dormitoryId = new URLSearchParams(window.location.search).get("id");

    await loadDropdowns();

    if (dormitoryId) {
        document.getElementById("formTitle").innerText = "🖋️ แก้ไขข้อมูลหอพัก";
        loadDormitoryData(dormitoryId);
    }

    document.getElementById("dormitoryForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        dormitoryId ? updateDormitory(dormitoryId) : addDormitory();
    });
});

// 🟢 โหลด Dropdown ประเภท, หมวดหมู่ และสิ่งอำนวยความสะดวก
async function loadDropdowns() {
    const endpoints = [
        { url: "http://localhost:3000/api/dormitory_types", id: "dormType", valueField: "Dormitory_Type_ID", textField: "Dormitory_Type" },
        { url: "http://localhost:3000/api/dormitory_categories", id: "category", valueField: "Category_ID", textField: "Category_Name" },
        { url: "http://localhost:3000/facilities", id: "facilityList", isCheckbox: true }
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint.url);
            const data = await res.json();

            if (endpoint.isCheckbox) {
                const container = document.getElementById(endpoint.id);
                data.forEach(facility => {
                    container.innerHTML += `
                        <label>
                            <input type="checkbox" name="facility" value="${facility.Facility_ID}"> ${facility.Facility_Name}
                        </label><br>
                    `;
                });
            } else {
                const select = document.getElementById(endpoint.id);
                select.innerHTML = `<option value="">-- เลือก --</option>`;
                data.forEach(item => {
                    select.innerHTML += `<option value="${item[endpoint.valueField]}">${item[endpoint.textField]}</option>`;
                });
            }
        } catch (error) {
            console.error(`❌ Error loading ${endpoint.id}:`, error);
        }
    }
}

// 🟢 โหลดข้อมูลหอพักสำหรับแก้ไข
async function loadDormitoryData(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/dormitories/${id}`);
        if (!res.ok) throw new Error("⚠️ ไม่พบข้อมูลหอพัก");

        const dorm = await res.json();
        document.getElementById("dormName").value = dorm.Dormitory_Name;
        document.getElementById("description").value = dorm.Description;
        document.getElementById("latitude").value = dorm.Latitude;
        document.getElementById("longitude").value = dorm.Longitude;
        document.getElementById("contactNumber").value = dorm.Contact_Number;
        document.getElementById("email").value = dorm.Dormitory_Email;
        document.getElementById("dormType").value = dorm.Dormitory_Type_ID;
        document.getElementById("category").value = dorm.Category_ID;

        if (dorm.Dormitory_Photo) {
            document.getElementById("currentPhoto").innerHTML = `
                <img src="http://localhost:3000/uploads/${dorm.Dormitory_Photo}" width="150" style="border-radius: 10px;">
            `;
        }

        // ✅ เช็คสิ่งอำนวยความสะดวก
        const selectedFacilities = dorm.Facilities.map(facility => facility.Facility_ID);
        document.querySelectorAll('input[name="facility"]').forEach(checkbox => {
            if (selectedFacilities.includes(parseInt(checkbox.value))) {
                checkbox.checked = true;
            }
        });

    } catch (error) {
        console.error("❌ Error loading dormitory data:", error);
        alert("⚠️ ไม่สามารถโหลดข้อมูลหอพัก");
    }
}

// 🟢 เพิ่มหอพักใหม่
async function addDormitory() {
    const formData = createFormData();
    try {
        const res = await fetch("http://localhost:3000/api/dormitories", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("❌ เพิ่มข้อมูลล้มเหลว");

        alert("✅ เพิ่มข้อมูลสำเร็จ!");
        window.location.href = "dormitory_list.html";
    } catch (error) {
        console.error("❌ Error adding dormitory:", error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
}

// 🟢 แก้ไขหอพัก
async function updateDormitory(id) {
    const formData = createFormData();
    formData.append("Dormitory_ID", id);

    try {
        const res = await fetch(`http://localhost:3000/api/dormitories/${id}`, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) throw new Error("❌ แก้ไขข้อมูลล้มเหลว");

        alert("✅ แก้ไขข้อมูลสำเร็จ!");
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("❌ Error updating dormitory:", error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
}

// 🟢 สร้าง FormData จากฟอร์ม
// 🟢 สร้าง FormData จากฟอร์ม
function createFormData() {
    const formData = new FormData();
    formData.append("Dormitory_Name", document.getElementById("dormName").value);
    formData.append("Description", document.getElementById("description").value);
    formData.append("Latitude", document.getElementById("latitude").value);
    formData.append("Longitude", document.getElementById("longitude").value);
    formData.append("Contact_Number", document.getElementById("contactNumber").value);
    formData.append("Dormitory_Email", document.getElementById("email").value);
    formData.append("Dormitory_Type_ID", document.getElementById("dormType").value);
    formData.append("Category_ID", document.getElementById("category").value);

    // ✅ ดึงค่า User_ID และ Owner_ID จาก sessionStorage (ถ้ามีระบบ login)
    const userId = sessionStorage.getItem("User_ID") || "4"; // ใช้ 4 เป็นค่าเริ่มต้นถ้าไม่มี session
    formData.append("User_ID", userId);
    formData.append("Owner_ID", userId);

    // ✅ ดึงค่าที่เลือกจาก input checkbox (สิ่งอำนวยความสะดวก)
    const facilities = Array.from(document.querySelectorAll('input[name="facility"]:checked'))
        .map(facility => parseInt(facility.value)); // แปลงเป็นตัวเลข
    formData.append("Facilities", JSON.stringify(facilities)); // ส่งไปเป็น JSON

    // ✅ ตรวจสอบว่ามีไฟล์อัปโหลดใหม่หรือไม่
    const photo = document.getElementById("dormPhoto").files[0];
    if (photo) {
        formData.append("Dormitory_Photo", photo);
    }

    return formData;
}

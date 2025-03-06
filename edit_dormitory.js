document.addEventListener("DOMContentLoaded", async () => {
    await loadEditDormitoryData();

    const form = document.getElementById("editDormitoryForm");
    const cancelButton = document.querySelector(".cancel-btn");

    if (!form) {
        console.error("❌ ไม่พบฟอร์ม editDormitoryForm");
        return;
    }

    // ✅ บันทึกข้อมูลเมื่อกดปุ่ม "บันทึก"
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await updateDormitory();
    });

    // ✅ เปลี่ยนหน้าไปยังรายการหอพักเมื่อกดปุ่ม "ยกเลิก"
    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            window.location.href = "dormitory_list.html";
        });
    }
});

// ✅ โหลดข้อมูลหอพัก
async function loadEditDormitoryData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dormitoryId = urlParams.get('id');

    if (!dormitoryId) {
        alert("⚠️ ไม่พบรหัสหอพักใน URL");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/dormitories/${dormitoryId}`);
        if (!res.ok) throw new Error("❌ ไม่สามารถโหลดข้อมูลหอพักได้");
        const dormitoryData = await res.json();

        console.log("🏠 Dormitory Data:", dormitoryData);
        console.log("✅ สิ่งอำนวยความสะดวกที่ถูกเลือก:", dormitoryData.facilities || "ไม่มีข้อมูล");

        document.getElementById("dormitory_id").value = dormitoryData.Dormitory_ID || "";
        document.getElementById("dormitory_name").value = dormitoryData.Dormitory_Name || "";
        document.getElementById("description").value = dormitoryData.Description || "";
        document.getElementById("contact_number").value = dormitoryData.Contact_Number || "";
        document.getElementById("dormitory_email").value = dormitoryData.Dormitory_Email || "";

        await loadDropdowns(dormitoryData);

    } catch (error) {
        console.error("❌ Error:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// ✅ โหลด dropdown และ checkbox สิ่งอำนวยความสะดวก
async function loadDropdowns(dormitoryData) {
    console.log("🏠 Dormitory Data:", dormitoryData);

    const selectedFacilities = Array.isArray(dormitoryData.facilities)
        ? dormitoryData.facilities.map(f => f.Facility_ID)
        : [];

    const endpoints = [
        { url: "http://localhost:3000/api/dormitory_types", id: "dormType", valueField: "Dormitory_Type_ID", textField: "Dormitory_Type", selectedValue: dormitoryData.Dormitory_Type_ID },
        { url: "http://localhost:3000/api/dormitory_categories", id: "category", valueField: "Category_ID", textField: "Category_Name", selectedValue: dormitoryData.Category_ID },
        { url: `http://localhost:3000/facilities?dormitoryId=${dormitoryData.Dormitory_ID}`, id: "facilityList", isCheckbox: true, selectedFacilities: selectedFacilities }
    ];

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(endpoint.url);
            const data = await res.json();

            if (endpoint.isCheckbox) {
                const container = document.getElementById(endpoint.id);
                container.innerHTML = ""; // ล้างค่าก่อนโหลดใหม่

                data.forEach(facility => {
                    const isChecked = selectedFacilities.includes(facility.Facility_ID) ? "checked" : "";
                    container.innerHTML += `
                        <label>
                            <input type="checkbox" name="facility" value="${facility.Facility_ID}" ${isChecked}> ${facility.Facility_Name}
                        </label><br>
                    `;
                });
            } else {
                const select = document.getElementById(endpoint.id);
                select.innerHTML = `<option value="">-- เลือก --</option>`;
                data.forEach(item => {
                    const isSelected = item[endpoint.valueField] == endpoint.selectedValue ? "selected" : "";
                    select.innerHTML += `<option value="${item[endpoint.valueField]}" ${isSelected}>${item[endpoint.textField]}</option>`;
                });
            }
        } catch (error) {
            console.error(`❌ Error loading ${endpoint.id}:`, error);
        }
    }
}

// ✅ อัปเดตข้อมูลหอพัก
async function updateDormitory() {
    const dormitoryId = document.getElementById("dormitory_id").value;
    const facilities = Array.from(document.querySelectorAll("input[name='facility']:checked")).map(input => parseInt(input.value));

    console.log(`🔍 ส่งค่าการอัปเดต: Dormitory_ID = ${dormitoryId}, Facilities =`, facilities);

    const dormitoryData = {
        Dormitory_Name: document.getElementById("dormitory_name").value,
        Description: document.getElementById("description").value,
        Contact_Number: document.getElementById("contact_number").value,
        Dormitory_Email: document.getElementById("dormitory_email").value,
        Dormitory_Type_ID: document.getElementById("dormType").value,
        Category_ID: document.getElementById("category").value,
        Facilities: facilities
    };

    try {
        console.log(`🚀 ส่งค่าการอัปเดตไปยัง API:`, dormitoryData);

        const res = await fetch(`http://localhost:3000/api/dormitories/${dormitoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dormitoryData)
        });

        if (!res.ok) throw new Error("❌ ไม่สามารถอัปเดตข้อมูลหอพักได้");

        alert("✅ แก้ไขข้อมูลสำเร็จ!");
        window.location.href = "dormitory_list.html";
    } catch (error) {
        console.error("❌ Error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
}
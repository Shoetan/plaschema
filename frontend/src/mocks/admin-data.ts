import type {
  Beneficiary,
  Facility,
  FieldWorker,
  Ward,
} from '@/types/admin.types'

export const communities: Ward[] = [
  { id: "C001", name: "Vom Central", state: "Plateau", lga: "Jos South", status: "Active", beneficiaries: 412, fieldWorkers: 3, newEnrollments: 48, lastActivity: "2 hours ago" },
  { id: "C002", name: "Shen Settlement", state: "Plateau", lga: "Jos North", status: "Active", beneficiaries: 289, fieldWorkers: 2, newEnrollments: 31, lastActivity: "5 hours ago" },
  { id: "C003", name: "Riyom Rural", state: "Plateau", lga: "Riyom", status: "Active", beneficiaries: 378, fieldWorkers: 4, newEnrollments: 52, lastActivity: "1 hour ago" },
  { id: "C004", name: "Barkin Ladi North", state: "Plateau", lga: "Barkin Ladi", status: "Active", beneficiaries: 156, fieldWorkers: 1, newEnrollments: 12, lastActivity: "Yesterday" },
  { id: "C005", name: "Pankshin Urban", state: "Plateau", lga: "Pankshin", status: "Active", beneficiaries: 534, fieldWorkers: 5, newEnrollments: 67, lastActivity: "3 hours ago" },
  { id: "C006", name: "Shendam East", state: "Plateau", lga: "Shendam", status: "Inactive", beneficiaries: 98, fieldWorkers: 0, newEnrollments: 0, lastActivity: "3 days ago" },
  { id: "C007", name: "Langtang Central", state: "Plateau", lga: "Langtang North", status: "Active", beneficiaries: 245, fieldWorkers: 2, newEnrollments: 28, lastActivity: "4 hours ago" },
  { id: "C008", name: "Mikang Ward", state: "Plateau", lga: "Mikang", status: "Active", beneficiaries: 187, fieldWorkers: 2, newEnrollments: 19, lastActivity: "6 hours ago" },
];

export const fieldWorkers: FieldWorker[] = [
  { id: "FW001", name: "Amina Yusuf", phone: "+234 803 456 7890", email: "amina.yusuf@plaschema.ng", community: "Vom Central", communityId: "C001", enrolled: 156, lastEnrollment: "2 hours ago", lastSync: "2 hours ago", status: "Active" },
  { id: "FW002", name: "Chidi Okafor", phone: "+234 805 234 5678", email: "chidi.okafor@plaschema.ng", community: "Shen Settlement", communityId: "C002", enrolled: 134, lastEnrollment: "5 hours ago", lastSync: "5 hours ago", status: "Active" },
  { id: "FW003", name: "Fatima Abdullahi", phone: "+234 806 789 0123", email: "fatima.a@plaschema.ng", community: "Riyom Rural", communityId: "C003", enrolled: 201, lastEnrollment: "1 hour ago", lastSync: "1 hour ago", status: "Active" },
  { id: "FW004", name: "Ibrahim Musa", phone: "+234 807 345 6789", email: "ibrahim.musa@plaschema.ng", community: "Pankshin Urban", communityId: "C005", enrolled: 87, lastEnrollment: "Yesterday", lastSync: "Yesterday", status: "Active" },
  { id: "FW005", name: "Ngozi Eze", phone: "+234 808 901 2345", email: "ngozi.eze@plaschema.ng", community: "Riyom Rural", communityId: "C003", enrolled: 177, lastEnrollment: "3 hours ago", lastSync: "3 hours ago", status: "Active" },
  { id: "FW006", name: "Aliyu Bello", phone: "+234 809 567 8901", email: "aliyu.bello@plaschema.ng", community: "Langtang Central", communityId: "C007", enrolled: 112, lastEnrollment: "4 hours ago", lastSync: "8 hours ago", status: "Active" },
  { id: "FW007", name: "Bimpe Adeyemi", phone: "+234 810 234 5678", email: "bimpe.a@plaschema.ng", community: "Mikang Ward", communityId: "C008", enrolled: 89, lastEnrollment: "6 hours ago", lastSync: "6 hours ago", status: "Inactive" },
  { id: "FW008", name: "Emmanuel Nwachukwu", phone: "+234 811 890 1234", email: "emma.n@plaschema.ng", community: "Barkin Ladi North", communityId: "C004", enrolled: 56, lastEnrollment: "Yesterday", lastSync: "2 days ago", status: "Active" },
];

export const beneficiaries: Beneficiary[] = [
  { id: "BEN-2024-00001", enrollmentId: "PL/BHCPF/2024/00001", name: "Musa Ibrahim", gender: "Male", community: "Vom Central", communityId: "C001", lga: "Jos South", ward: "Vom", facility: "Vom Christian Hospital", category: "IDPs", fieldWorker: "Amina Yusuf", fieldWorkerId: "FW001", dateEnrolled: "10 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: true },
  { id: "BEN-2024-00002", enrollmentId: "PL/BHCPF/2024/00002", name: "Aisha Mohammed", gender: "Female", community: "Vom Central", communityId: "C001", lga: "Jos South", ward: "Vom", facility: "Vom Christian Hospital", category: "Elderly 65+", fieldWorker: "Amina Yusuf", fieldWorkerId: "FW001", dateEnrolled: "10 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: false },
  { id: "BEN-2024-00003", enrollmentId: "PL/BHCPF/2024/00003", name: "Emeka Okonkwo", gender: "Male", community: "Shen Settlement", communityId: "C002", lga: "Jos North", ward: "Tudun Wada", facility: "Tudun Wada PHC", category: "Indigents / Very Poor / Others", fieldWorker: "Chidi Okafor", fieldWorkerId: "FW002", dateEnrolled: "09 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: false },
  { id: "BEN-2024-00004", enrollmentId: "PL/BHCPF/2024/00004", name: "Halima Usman", gender: "Female", community: "Riyom Rural", communityId: "C003", lga: "Riyom", ward: "Riyom Central", facility: "Riyom PHC", category: "Indigents / Very Poor / Others", fieldWorker: "Fatima Abdullahi", fieldWorkerId: "FW003", dateEnrolled: "09 Aug 2024", status: "Enrolled", syncStatus: "Pending", hasPrinted: false },
  { id: "BEN-2024-00005", enrollmentId: "PL/BHCPF/2024/00005", name: "Tunde Bakare", gender: "Male", community: "Pankshin Urban", communityId: "C005", lga: "Pankshin", ward: "Pankshin Central", facility: "Pankshin General Hospital", category: "IDPs", fieldWorker: "Ibrahim Musa", fieldWorkerId: "FW004", dateEnrolled: "08 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: true },
  { id: "BEN-2024-00006", enrollmentId: "PL/BHCPF/2024/00006", name: "Ngozi Obi", gender: "Female", community: "Riyom Rural", communityId: "C003", lga: "Riyom", ward: "Riyom Central", facility: "Riyom PHC", category: "Elderly 65+", fieldWorker: "Ngozi Eze", fieldWorkerId: "FW005", dateEnrolled: "08 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: false },
  { id: "BEN-2024-00007", enrollmentId: "PL/BHCPF/2024/00007", name: "Yakubu Garba", gender: "Male", community: "Langtang Central", communityId: "C007", lga: "Langtang North", ward: "Langtang", facility: "Langtang General Hospital", category: "Indigents / Very Poor / Others", fieldWorker: "Aliyu Bello", fieldWorkerId: "FW006", dateEnrolled: "07 Aug 2024", status: "Enrolled", syncStatus: "Failed", hasPrinted: false },
  { id: "BEN-2024-00008", enrollmentId: "PL/BHCPF/2024/00008", name: "Chioma Nwosu", gender: "Female", community: "Mikang Ward", communityId: "C008", lga: "Mikang", ward: "Mikang Ward A", facility: "Mikang PHC", category: "Elderly 65+", fieldWorker: "Bimpe Adeyemi", fieldWorkerId: "FW007", dateEnrolled: "07 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: true },
  { id: "BEN-2024-00009", enrollmentId: "PL/BHCPF/2024/00009", name: "Suleiman Yaro", gender: "Male", community: "Vom Central", communityId: "C001", lga: "Jos South", ward: "Vom", facility: "Vom Christian Hospital", category: "IDPs", fieldWorker: "Amina Yusuf", fieldWorkerId: "FW001", dateEnrolled: "06 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: false },
  { id: "BEN-2024-00010", enrollmentId: "PL/BHCPF/2024/00010", name: "Adaeze Okafor", gender: "Female", community: "Barkin Ladi North", communityId: "C004", lga: "Barkin Ladi", ward: "Barkin Ladi Central", facility: "Barkin Ladi General Hospital", category: "Indigents / Very Poor / Others", fieldWorker: "Emmanuel Nwachukwu", fieldWorkerId: "FW008", dateEnrolled: "06 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: false },
  { id: "BEN-2024-00011", enrollmentId: "PL/BHCPF/2024/00011", name: "Rashida Bawa", gender: "Female", community: "Shen Settlement", communityId: "C002", lga: "Jos North", ward: "Tudun Wada", facility: "Tudun Wada PHC", category: "Elderly 65+", fieldWorker: "Chidi Okafor", fieldWorkerId: "FW002", dateEnrolled: "05 Aug 2024", status: "Enrolled", syncStatus: "Synced", hasPrinted: true },
  { id: "BEN-2024-00012", enrollmentId: "PL/BHCPF/2024/00012", name: "Femi Adegoke", gender: "Male", community: "Riyom Rural", communityId: "C003", lga: "Riyom", ward: "Riyom Central", facility: "Riyom PHC", category: "IDPs", fieldWorker: "Fatima Abdullahi", fieldWorkerId: "FW003", dateEnrolled: "05 Aug 2024", status: "Enrolled", syncStatus: "Pending", hasPrinted: false },
];

export const recentActivity = [
  { id: 1, type: "enrollment", message: "Musa Ibrahim enrolled by Amina Yusuf", community: "Vom Central", time: "2 min ago" },
  { id: 2, type: "enrollment", message: "Aisha Mohammed enrolled by Amina Yusuf", community: "Vom Central", time: "15 min ago" },
  { id: 3, type: "sync", message: "Fatima Abdullahi synchronized 12 records", community: "Riyom Rural", time: "1 hour ago" },
  { id: 4, type: "worker", message: "Emmanuel Nwachukwu active in Barkin Ladi North", community: "Barkin Ladi North", time: "2 hours ago" },
  { id: 5, type: "community", message: "Mikang Ward community created", community: "Mikang Ward", time: "3 hours ago" },
  { id: 6, type: "update", message: "Yakubu Garba record updated", community: "Langtang Central", time: "4 hours ago" },
];

export const enrollmentTrendData = [
  { month: "Jan", enrollments: 320 },
  { month: "Feb", enrollments: 445 },
  { month: "Mar", enrollments: 389 },
  { month: "Apr", enrollments: 512 },
  { month: "May", enrollments: 478 },
  { month: "Jun", enrollments: 634 },
  { month: "Jul", enrollments: 589 },
  { month: "Aug", enrollments: 712 },
];

export const facilities: Facility[] = [
  { id: "FAC001", code: "HCP/JOS/N/001", name: "Tudun Wada PHC", type: "Primary Health Centre", level: "Primary", ownership: "Public", state: "Plateau", lga: "Jos North", ward: "Tudun Wada", community: "Tudun Wada", address: "Tudun Wada Street, Jos North LGA", contactPerson: "Dr. Fatima Suleiman", phone: "+234 803 111 0001", email: "tudun.wada@phc.plateau.gov.ng", status: "Active", beneficiaries: 156, onboardingDate: "15 Jan 2024" },
  { id: "FAC002", code: "HCP/JOS/S/002", name: "Vom Christian Hospital", type: "Hospital", level: "Secondary", ownership: "Faith-Based", state: "Plateau", lga: "Jos South", ward: "Vom", community: "Vom", address: "Hospital Road, Vom, Jos South", contactPerson: "Dr. Emmanuel Nwachukwu", phone: "+234 803 222 0002", email: "vom.hospital@plateau.ng", status: "Active", beneficiaries: 412, onboardingDate: "01 Feb 2024" },
  { id: "FAC003", code: "HCP/BKL/G/003", name: "Barkin Ladi General Hospital", type: "Hospital", level: "Secondary", ownership: "Public", state: "Plateau", lga: "Barkin Ladi", ward: "Barkin Ladi Central", community: "Barkin Ladi", address: "General Hospital Road, Barkin Ladi", contactPerson: "Dr. Aisha Mohammed", phone: "+234 803 333 0003", email: "blgh@plateau.gov.ng", status: "Active", beneficiaries: 289, onboardingDate: "01 Mar 2024" },
  { id: "FAC004", code: "HCP/PAN/G/004", name: "Pankshin General Hospital", type: "Hospital", level: "Secondary", ownership: "Public", state: "Plateau", lga: "Pankshin", ward: "Pankshin Central", community: "Pankshin", address: "Hospital Avenue, Pankshin LGA", contactPerson: "Nurse Halima Yusuf", phone: "+234 803 444 0004", email: "pankshin.gh@plateau.gov.ng", status: "Active", beneficiaries: 178, onboardingDate: "15 Mar 2024" },
  { id: "FAC005", code: "HCP/LTN/G/005", name: "Langtang General Hospital", type: "Hospital", level: "Secondary", ownership: "Public", state: "Plateau", lga: "Langtang North", ward: "Langtang", community: "Langtang", address: "Government Road, Langtang North", contactPerson: "Dr. Yakubu Garba", phone: "+234 803 555 0005", email: "langtang.gh@plateau.gov.ng", status: "Active", beneficiaries: 134, onboardingDate: "01 Apr 2024" },
  { id: "FAC006", code: "HCP/RYM/P/006", name: "Riyom PHC", type: "Primary Health Centre", level: "Primary", ownership: "Public", state: "Plateau", lga: "Riyom", ward: "Riyom Central", community: "Riyom", address: "PHC Road, Riyom LGA", contactPerson: "Nurse Ngozi Obi", phone: "+234 803 666 0006", email: "riyom.phc@plateau.gov.ng", status: "Active", beneficiaries: 98, onboardingDate: "15 Apr 2024" },
  { id: "FAC007", code: "HCP/MKG/P/007", name: "Mikang PHC", type: "Primary Health Centre", level: "Primary", ownership: "Public", state: "Plateau", lga: "Mikang", ward: "Mikang Ward A", community: "Mikang", address: "Community Health Road, Mikang", contactPerson: "CHO Bimpe Adeyemi", phone: "+234 803 777 0007", email: "mikang.phc@plateau.gov.ng", status: "Active", beneficiaries: 67, onboardingDate: "01 May 2024" },
  { id: "FAC008", code: "HCP/SHD/G/008", name: "Shendam General Hospital", type: "Hospital", level: "Secondary", ownership: "Public", state: "Plateau", lga: "Shendam", ward: "Shendam Central", community: "Shendam", address: "Hospital Road, Shendam LGA", contactPerson: "Dr. Chidi Okafor", phone: "+234 803 888 0008", email: "shendam.gh@plateau.gov.ng", status: "Inactive", beneficiaries: 0, onboardingDate: "15 May 2024" },
  { id: "FAC009", code: "HCP/MNG/G/009", name: "Mangu General Hospital", type: "Hospital", level: "Secondary", ownership: "Public", state: "Plateau", lga: "Mangu", ward: "Mangu Central", community: "Mangu", address: "Government Road, Mangu LGA", contactPerson: "Dr. Ibrahim Musa", phone: "+234 803 999 0009", email: "mangu.gh@plateau.gov.ng", status: "Active", beneficiaries: 201, onboardingDate: "01 Jun 2024" },
  { id: "FAC010", code: "HCP/JOS/P/010", name: "JUTH - Jos University Teaching Hospital", type: "Specialist Hospital", level: "Tertiary", ownership: "Public", state: "Plateau", lga: "Jos North", ward: "Anglo Jos", community: "Jos", address: "JUTH Road, Jos North LGA", contactPerson: "Prof. Aliyu Bello", phone: "+234 803 100 0010", email: "juth@plateau.edu.ng", status: "Active", beneficiaries: 378, onboardingDate: "01 Jan 2024" },
];

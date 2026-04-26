# OralVis UML Use Case Diagram

This diagram follows core UML use case rules:
- actors are external to the system boundary,
- use cases use verb-noun naming,
- the boundary is explicitly named,
- `<<include>>` is used for mandatory reusable behavior,
- `<<extend>>` is used for optional behavior,
- actor generalization is modeled from `Patient` and `Admin` to `User`.

```plantuml
@startuml
left to right direction

actor User
actor Patient
actor Admin

Patient -|> User
Admin -|> User

rectangle "MedAnnotate System" {
    usecase "Register Account" as UC_Register
    usecase "Login Account" as UC_Login
    usecase "Authenticate User" as UC_Authenticate

    usecase "Upload Oral Image" as UC_Upload
    usecase "View Submission Status" as UC_ViewStatus
    usecase "Edit Submission" as UC_Edit
    usecase "Delete Submission" as UC_Delete
    usecase "Download Report" as UC_Download
    usecase "Validate Submission State" as UC_ValidateState

    usecase "View All Submissions" as UC_ViewAll
    usecase "Open Annotation Workspace" as UC_OpenAnnot
    usecase "Annotate Image" as UC_Annotate
    usecase "Save Annotation" as UC_SaveAnnot
    usecase "Add Recommendations" as UC_AddRec
    usecase "Generate PDF Report" as UC_GeneratePDF
}

User --> UC_Register
User --> UC_Login

Patient --> UC_Upload
Patient --> UC_ViewStatus
Patient --> UC_Edit
Patient --> UC_Delete
Patient --> UC_Download

Admin --> UC_ViewAll
Admin --> UC_OpenAnnot
Admin --> UC_Annotate
Admin --> UC_SaveAnnot
Admin --> UC_GeneratePDF

UC_Login .> UC_Authenticate : <<include>>
UC_Edit .> UC_ValidateState : <<include>>
UC_Delete .> UC_ValidateState : <<include>>
UC_Download .> UC_ValidateState : <<include>>
UC_OpenAnnot .> UC_ViewAll : <<include>>

UC_AddRec .> UC_SaveAnnot : <<extend>>
@enduml
```

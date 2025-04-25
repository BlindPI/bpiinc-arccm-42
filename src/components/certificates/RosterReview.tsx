import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface RosterEntry {
  studentName: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus?: string;
  hasError: boolean;
  errors?: string[];
  rowIndex: number;
}

interface RosterReviewProps {
  data: RosterEntry[];
  totalCount: number;
  errorCount: number;
}

export function RosterReview({ data, totalCount, errorCount }: RosterReviewProps) {
  const columns: ColumnDef<RosterEntry>[] = [
    {
      accessorKey: "studentName",
      header: "Student Name",
      cell: ({ row }) => {
        const hasError = row.original.hasError;
        return (
          <div className="flex items-center gap-2">
            {hasError ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            <span className={hasError ? "text-destructive" : ""}>{row.getValue("studentName")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "province",
      header: "Province",
    },
    {
      accessorKey: "postalCode",
      header: "Postal Code",
    },
    {
      accessorKey: "firstAidLevel",
      header: "First Aid Level",
    },
    {
      accessorKey: "cprLevel",
      header: "CPR Level",
    },
    {
      accessorKey: "assessmentStatus",
      header: "Assessment Status",
      cell: ({ row }) => {
        const status = row.getValue("assessmentStatus") as string;
        return status ? (
          <Badge variant={status.toUpperCase() === "PASS" ? "success" : "destructive"}>
            {status}
          </Badge>
        ) : null;
      },
    },
    {
      id: "errors",
      header: "Issues",
      cell: ({ row }) => {
        const errors = row.original.errors;
        if (!errors?.length) return null;
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{errors.join(", ")}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valid Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{totalCount - errorCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Records with Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {errorCount} record{errorCount > 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} attention. 
            Please review and correct the issues before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentsTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

export function PaymentsTable({
  payments,
  isLoading = false,
}: PaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full rounded-md border">
        <div className="p-4 text-center">Loading payments...</div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="w-full rounded-md border">
        <div className="p-4 text-center">No payments found</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Receipt #</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {formatDate(payment.payment_date)}
              </TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>{payment.payment_method}</TableCell>
              <TableCell>{payment.receipt_number || "-"}</TableCell>
              <TableCell>{payment.created_by}</TableCell>
              <TableCell className="max-w-xs truncate">
                {payment.notes || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

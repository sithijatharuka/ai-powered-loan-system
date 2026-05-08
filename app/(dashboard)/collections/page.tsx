"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const customersData = [
  {
    id: 1,
    name: "Kamal Perera",
    contact: "0771234567",
    balance: 30000,
  },
  {
    id: 2,
    name: "Nimal Silva",
    contact: "0712345678",
    balance: 45000,
  },

];

export default function Collections() {
  const [search, setSearch] = useState("");

  const [amount, setAmount] = useState("");

  const filtered = customersData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.includes(search)
  );

  function handlePayment(customerId: number) {
    console.log({
      customerId,
      amount,
      date: new Date(),
    });

    setAmount("");
  }

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-bold">
          Collections
        </h1>

        <Input
          placeholder="Search customer..."
          className="w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white">

        <Table>

          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>

            {filtered.map((c) => (

              <TableRow key={c.id}>

                <TableCell>#{c.id}</TableCell>

                <TableCell className="font-medium">
                  {c.name}
                </TableCell>

                <TableCell>{c.contact}</TableCell>

                <TableCell>
                  <Badge variant="destructive">
                    Rs. {c.balance.toLocaleString()}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">

                  {/* PAYMENT DIALOG */}
                  <Dialog>

                    <DialogTrigger asChild>
                      <Button size="sm">
                        Add Payment
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="rounded-2xl">

                      <DialogHeader>
                        <DialogTitle>
                          Add Payment for {c.name}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">

                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) =>
                            setAmount(e.target.value)
                          }
                        />

                        <Button
                          className="w-full"
                          onClick={() =>
                            handlePayment(c.id)
                          }
                        >
                          Save Payment
                        </Button>

                      </div>

                    </DialogContent>

                  </Dialog>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </div>

    </div>
  );
}
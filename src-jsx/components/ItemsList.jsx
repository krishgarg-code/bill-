import React, { useState } from "react";
import { Edit, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ItemsList = ({
  items,
  editingItem,
  onEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  itemTotal,
}) => {
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleEdit = (item) => {
    setEditQuantity(item.quantity.toString());
    setEditPrice(item.price.toString());
    onEdit(item.id);
  };

  const handleUpdate = (id) => {
    const quantity = parseFloat(editQuantity);
    const price = parseFloat(editPrice);

    if (!isNaN(quantity) && !isNaN(price)) {
      onUpdate(id, quantity, price);
      setEditQuantity("");
      setEditPrice("");
    }
  };

  const handleCancel = () => {
    setEditQuantity("");
    setEditPrice("");
    onCancelEdit();
  };

  if (items.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm mb-6">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
              📋
            </div>
          </div>
          <p className="text-gray-500">
            No items added yet. Add your first item to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm mb-6">
      <CardHeader className="pb-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-gray-800 flex items-center justify-between">
          <span>Items ({items.length})</span>
          <span className="text-orange-600 font-semibold">
            Total: ₹{itemTotal.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <Input
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-800">
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <Input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                      />
                    ) : (
                      <span className="text-sm text-gray-800">
                        ₹{item.price}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    ₹{item.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingItem === item.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(item.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="border-gray-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(item.id)}
                          className="border-gray-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsList;

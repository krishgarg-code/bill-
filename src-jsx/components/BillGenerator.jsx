import React, { useEffect, useRef, useState } from "react";
import { Calculator, FileText, Plus, RotateCcw, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "./InvoiceModal";

const BillGenerator = ({ onLogout }) => {
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    partyName: "",
    billNumber: "",
    date: "",
    vehicleNumber: "",
    bill: "",
    amount: "",
    quanrev: "",
    dust: "",
    gst: "",
    tds2: "",
    tds01: "",
    be: "",
    dalla: "",
    rtgsCharges: "",
  });

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [savedDrafts, setSavedDrafts] = useState([]);

  // Refs for keyboard navigation - create a map of input IDs to refs
  const inputRefs = useRef({});

  // Function to add input refs to the map
  const addInputRef = (id, el) => {
    if (el) {
      inputRefs.current[id] = el;
    }
  };

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("billGenerator_formData");
    const savedItems = localStorage.getItem("billGenerator_items");
    const drafts = localStorage.getItem("billGenerator_drafts");

    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts));
    }

    // Focus first input
    setTimeout(() => {
      inputRefs.current["partyName"]?.focus();
    }, 100);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("billGenerator_formData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("billGenerator_items", JSON.stringify(items));
  }, [items]);

  // Calculations
  const totalQuantity =
    (parseFloat(formData.quanrev) || 0) - (parseFloat(formData.dust) || 0);
  const itemTotal = items.reduce((acc, item) => acc + item.total, 0);
  const OPFP = (itemTotal * 0.015).toFixed(0);
  const sTotal = (itemTotal - parseFloat(OPFP)).toFixed(0);
  const grandTotal =
    items.length ||
    formData.gst ||
    formData.be ||
    formData.tds2 ||
    formData.tds01 ||
    formData.dalla
      ? (
          parseFloat(sTotal || "0") +
          parseFloat(formData.gst || "0") -
          parseFloat(formData.be || "0") -
          parseFloat(formData.tds2 || "0") -
          parseFloat(formData.tds01 || "0") -
          parseFloat(formData.dalla || "0") -
          (formData.rtgsCharges ? parseFloat(formData.rtgsCharges) : 0)
        ).toFixed(2)
      : "0.00";

  const endTotal = (parseFloat(formData.amount) || 0) - parseFloat(grandTotal);

  // Form handlers
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Define the navigation order for inputs
  const inputOrder = [
    "partyName",
    "billNumber", 
    "amount",
    "bill",
    "quanrev",
    "dust",
    "date",
    "vehicleNumber",
    "gst",
    "tds2",
    "tds01",
    "be",
    "dalla",
    "rtgsCharges",
    "quantity",
    "price"
  ];

  // Keyboard navigation
  const handleKeyDown = (e, currentInputId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateToNextInput(currentInputId);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateToNextInput(currentInputId);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateToPreviousInput(currentInputId);
    }

    // Handle Tab key for natural form navigation
    if (e.key === "Tab") {
      // Let default Tab behavior work, but ensure our custom navigation is available
      // This allows users to use both Tab and Enter/Arrow keys
    }

    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }

    if (e.key === "Shift") {
      e.preventDefault();
      handleAddItem();
    }

    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSaveDraft();
    }
  };

  // Navigate to next input
  const navigateToNextInput = (currentInputId) => {
    const currentIndex = inputOrder.indexOf(currentInputId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % inputOrder.length;
    const nextInputId = inputOrder[nextIndex];
    const nextInput = inputRefs.current[nextInputId];
    
    if (nextInput) {
      nextInput.focus();
      // Select all text if it's a new input
      if (nextInputId === "quantity" || nextInputId === "price") {
        nextInput.select();
      }
      
      // Add visual feedback
      nextInput.classList.add("ring-2", "ring-orange-300");
      setTimeout(() => {
        nextInput.classList.remove("ring-2", "ring-orange-300");
      }, 300);
    }
  };

  // Navigate to previous input
  const navigateToPreviousInput = (currentInputId) => {
    const currentIndex = inputOrder.indexOf(currentInputId);
    if (currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? inputOrder.length - 1 : currentIndex - 1;
    const prevInputId = inputOrder[prevIndex];
    const prevInput = inputRefs.current[prevInputId];
    
    if (prevInput) {
      prevInput.focus();
      // Select all text if it's a new input
      if (prevInputId === "quantity" || prevInputId === "price") {
        prevInput.select();
      }
      
      // Add visual feedback
      prevInput.classList.add("ring-2", "ring-orange-300");
      setTimeout(() => {
        prevInput.classList.remove("ring-2", "ring-orange-300");
      }, 300);
    }
  };

  // Item management
  const handleAddItem = () => {
    if (
      !quantity ||
      !price ||
      isNaN(parseFloat(quantity)) ||
      isNaN(parseFloat(price))
    ) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid quantity and price",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      total: parseFloat(quantity) * parseFloat(price),
    };

    setItems((prev) => [...prev, newItem]);
    setQuantity("");
    setPrice("");

    // Focus back to quantity input after adding item
    setTimeout(() => {
      const quantityInput = inputRefs.current["quantity"];
      if (quantityInput) {
        quantityInput.focus();
      }
    }, 100);

    toast({
      title: "Item Added",
      description: `Added ${quantity} × ₹${price} = ₹${newItem.total.toFixed(2)}`,
      duration: 1000,
    });
  };

  const handleDeleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been removed from the bill",
      duration: 1000,
    });
  };

  // Generate invoice
  const handleGenerate = () => {
    if (
      !formData.partyName ||
      !formData.date ||
      !formData.vehicleNumber ||
      items.length === 0
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please fill all required fields and add at least one item",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }
    setShowInvoice(true);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      partyName: "",
      billNumber: "",
      date: "",
      vehicleNumber: "",
      bill: "",
      amount: "",
      quanrev: "",
      dust: "",
      gst: "",
      tds2: "",
      tds01: "",
      be: "",
      dalla: "",
      rtgsCharges: "",
    });
    setQuantity("");
    setPrice("");
    setItems([]);
    localStorage.removeItem("billGenerator_formData");
    localStorage.removeItem("billGenerator_items");

    toast({
      title: "Form Reset",
      description: "All fields have been cleared",
      duration: 1000,
    });
  };

  // // Save draft
  // const handleSaveDraft = () => {
  //   const draft = {
  //     id: Date.now().toString(),
  //     name: `${formData.partyName || "Draft"} - ${new Date().toLocaleDateString()}`,
  //     formData,
  //     items,
  //     createdAt: new Date().toISOString(),
  //   };

  //   const newDrafts = [...savedDrafts, draft];
  //   setSavedDrafts(newDrafts);
  //   localStorage.setItem("billGenerator_drafts", JSON.stringify(newDrafts));

  //   toast({
  //     title: "Draft Saved",
  //     description: "Your bill has been saved as a draft",
  //     duration: 1000,
  //   });
  // };

  // // Load draft
  // const handleLoadDraft = (draft) => {
  //   setFormData(draft.formData);
  //   setItems(draft.items);

  //   toast({
  //     title: "Draft Loaded",
  //     description: `Loaded draft: ${draft.name}`,
  //     duration: 1000,
  //   });
  // };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[2000px] mx-auto p-2 md:p-4 mx-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 md:mb-8 mt-6 md:mt-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1 md:mb-2">
              Bill Generator
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              size="default"
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 text-base px-5 py-2 h-auto"
            >
              <RotateCcw size={18} className="mr-2" />
              Reset
            </Button>

            <Button
              onClick={handleGenerate}
              size="default"
              className="bg-orange-500 hover:bg-orange-600 text-base px-5 py-2 h-auto"
            >
              <FileText size={18} className="mr-2" />
              Generate Bill
            </Button>

            <Button
              onClick={onLogout}
              variant="outline"
              size="default"
              className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 text-base px-5 py-2 h-auto"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content Grid - 3 large columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
          {/* Left Column - Basic Information */}
          <Card className="bg-white border-slate-200 shadow-lg md:h-[630px] rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText size={18} />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-3">
                <Label
                  htmlFor="partyName"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Party Name *
                </Label>
                <Input
                  id="partyName"
                  ref={(el) => addInputRef("partyName", el)}
                  onKeyDown={(e) => handleKeyDown(e, "partyName")}
                  value={formData.partyName}
                  onChange={(e) => updateFormData("partyName", e.target.value)}
                  placeholder="Enter party name"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="billNumber"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Bill Number *
                </Label>
                <Input
                  id="billNumber"
                  ref={(el) => addInputRef("billNumber", el)}
                  onKeyDown={(e) => handleKeyDown(e, "billNumber")}
                  value={formData.billNumber}
                  onChange={(e) => updateFormData("billNumber", e.target.value)}
                  placeholder="Enter bill number"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="amount"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Bill Amount
                  </Label>
                  <Input
                    id="amount"
                    ref={(el) => addInputRef("amount", el)}
                    onKeyDown={(e) => handleKeyDown(e, "amount")}
                    value={formData.amount}
                    onChange={(e) => updateFormData("amount", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="bill"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Basic Price
                  </Label>
                  <Input
                    id="bill"
                    ref={(el) => addInputRef("bill", el)}
                    onKeyDown={(e) => handleKeyDown(e, "bill")}
                    value={formData.bill}
                    onChange={(e) => updateFormData("bill", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="quanrev"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Quantity Received
                  </Label>
                  <Input
                    id="quanrev"
                    ref={(el) => addInputRef("quanrev", el)}
                    onKeyDown={(e) => handleKeyDown(e, "quanrev")}
                    value={formData.quanrev}
                    onChange={(e) => updateFormData("quanrev", e.target.value)}
                    placeholder="0"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="dust"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Dust
                  </Label>
                  <Input
                    id="dust"
                    ref={(el) => addInputRef("dust", el)}
                    onKeyDown={(e) => handleKeyDown(e, "dust")}
                    value={formData.dust}
                    onChange={(e) => updateFormData("dust", e.target.value)}
                    placeholder="0"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              {totalQuantity >= 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-800">Final Weight:</strong>{" "}
                    {formData.quanrev ? formData.quanrev : 0} - {formData.dust ? formData.dust : 0} ={" "}
                    <span className="font-bold text-orange-600 text-base">
                      {totalQuantity}
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="date"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    ref={(el) => addInputRef("date", el)}
                    onKeyDown={(e) => handleKeyDown(e, "date")}
                    value={formData.date}
                    onChange={(e) => updateFormData("date", e.target.value)}
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="vehicleNumber"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Vehicle Number *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    ref={(el) => addInputRef("vehicleNumber", el)}
                    onKeyDown={(e) => handleKeyDown(e, "vehicleNumber")}
                    value={formData.vehicleNumber}
                    onChange={(e) =>
                      updateFormData("vehicleNumber", e.target.value)
                    }
                    placeholder="Enter vehicle number"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle Column - Financial Details */}
          <Card className="bg-white border-slate-200 shadow-lg md:h-[630px] rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calculator size={18} />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="gst"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    GST
                  </Label>
                  <Input
                    id="gst"
                    ref={(el) => addInputRef("gst", el)}
                    onKeyDown={(e) => handleKeyDown(e, "gst")}
                    value={formData.gst}
                    onChange={(e) => updateFormData("gst", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="tds2"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    TDS (2%)
                  </Label>
                  <Input
                    id="tds2"
                    ref={(el) => addInputRef("tds2", el)}
                    onKeyDown={(e) => handleKeyDown(e, "tds2")}
                    value={formData.tds2}
                    onChange={(e) => updateFormData("tds2", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="tds01"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    TDS (0.1%)
                  </Label>
                  <Input
                    id="tds01"
                    ref={(el) => addInputRef("tds01", el)}
                    onKeyDown={(e) => handleKeyDown(e, "tds01")}
                    value={formData.tds01}
                    onChange={(e) => updateFormData("tds01", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="be"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Billing Excess
                  </Label>
                  <Input
                    id="be"
                    ref={(el) => addInputRef("be", el)}
                    onKeyDown={(e) => handleKeyDown(e, "be")}
                    value={formData.be}
                    onChange={(e) => updateFormData("be", e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="dalla"
                  className="text-slate-700 font-semibold text-sm"
                >
                  Dalla
                </Label>
                <Input
                  id="dalla"
                  ref={(el) => addInputRef("dalla", el)}
                  onKeyDown={(e) => handleKeyDown(e, "dalla")}
                  value={formData.dalla}
                  onChange={(e) => updateFormData("dalla", e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>
              
              <div className="space-y-3">
                <Label
                  htmlFor="rtgsCharges"
                  className="text-slate-700 font-semibold text-sm"
                >
                  RTGS Charges
                </Label>
                <Input
                  id="rtgsCharges"
                  ref={(el) => addInputRef("rtgsCharges", el)}
                  onKeyDown={(e) => handleKeyDown(e, "rtgsCharges")}
                  value={formData.rtgsCharges}
                  onChange={(e) => updateFormData("rtgsCharges", e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-700">
                  <strong className="text-slate-800">Dhara (1.5%):</strong>{" "}
                  <span className="text-blue-600 font-semibold text-base">
                    ₹{OPFP}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Add Items */}
          <Card className="bg-white border-slate-200 shadow-lg md:h-[630px] flex flex-col rounded-lg border border-slate-300">
            <CardHeader className="pb-4 bg-slate-800 border-b border-slate-700">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Plus size={18} />
                Add Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 flex flex-col">
              {/* Fixed top section with inputs and button */}
              <div className="space-y-4 mb-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="quantity"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    ref={(el) => addInputRef("quantity", el)}
                    onKeyDown={(e) => handleKeyDown(e, "quantity")}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="price"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Price
                  </Label>
                  <Input
                    id="price"
                    ref={(el) => addInputRef("price", el)}
                    onKeyDown={(e) => handleKeyDown(e, "price")}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className="bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-orange-200 text-sm h-10"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                className="w-full bg-green-600 hover:bg-green-700 text-base h-10 mb-4 md:mb-6"
                disabled={!quantity || !price}
              >
                <Plus size={18} className="mr-2" />
                Add Item (Shift)
              </Button>

              {/* Items List with fixed header and scrollable content */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Items Added
                  </h3>
                  {items.length > 0 && (
                    <span className="text-orange-600 font-semibold text-base">
                      Total: ₹{itemTotal.toFixed(2)}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-slate-400 mb-3">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                        📋
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm">No items added yet</p>
                  </div>
                ) : (
                  <div className="max-h-[260px] md:h-[200px] overflow-y-auto bg-slate-50 rounded-lg p-3 md:p-4 border border-slate-200">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="text-slate-500 font-medium text-sm">
                                #{index + 1}
                              </span>
                              <div className="text-slate-800">
                                <span className="font-semibold text-base">
                                  {item.quantity}
                                </span>
                                <span className="text-slate-500 mx-2">×</span>
                                <span className="font-semibold text-base">
                                  ₹{item.price}
                                </span>
                                <span className="text-slate-500 mx-2">=</span>
                                <span className="font-bold text-orange-600 text-base">
                                  ₹{item.total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                            className="border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {items.length >= 0 && (
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-orange-100 text-base mb-2">Items Total</p>
                  <p className="text-3xl font-bold">₹{itemTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-base mb-2">
                    After Deductions
                  </p>
                  <p className="text-3xl font-bold">₹{grandTotal}</p>
                </div>
                {formData.amount && (
                  <div>
                    <p className="text-orange-100 text-base mb-2">Net Amount</p>
                    <p className="text-3xl font-bold">₹{formData.amount}</p>
                  </div>
                )}
                {formData.amount && (
                  <div>
                    <p className="text-orange-100 text-base mb-2">Balance</p>
                    <p
                      className={`text-3xl font-bold ${endTotal < 0 ? "text-red-200" : "text-green-200"}`}
                    >
                      ₹{endTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyboard Shortcuts Help */}
        <Card className="bg-slate-100 border-slate-200 mb-8">
          <CardContent className="p-4">
            <div className="text-center text-slate-600 text-sm">
              <span className="font-semibold">Keyboard Navigation:</span>{" "}
              <span className="bg-white px-2 py-1 rounded border mx-1">Enter</span> or{" "}
              <span className="bg-white px-2 py-1 rounded border mx-1">↓</span> to next field,{" "}
              <span className="bg-white px-2 py-1 rounded border mx-1">↑</span> to previous field,{" "}
              <span className="bg-white px-2 py-1 rounded border mx-1">Shift</span> to add item,{" "}
              <span className="bg-white px-2 py-1 rounded border mx-1">Ctrl+Enter</span> to generate bill
            </div>
          </CardContent>
        </Card>

        {/* Invoice Modal */}
        {showInvoice && (
          <InvoiceModal
            formData={formData}
            items={items}
            calculations={{
              itemTotal,
              OPFP,
              grandTotal,
              endTotal,
              totalQuantity
            }}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BillGenerator;

import React from "react";

const OrderSummary = ({ items, totalPrice, onCheckout, processing }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
      <h3 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h3>

      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.nama_obat}
              <span className="text-gray-500"> x{item.jumlah}</span>
            </span>
            <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-cyan-600">
            Rp {totalPrice.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={processing}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
      >
        {processing ? "Memproses..." : "Checkout"}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        *Pembayaran akan dikonfirmasi setelah checkout
      </p>
    </div>
  );
};

export default OrderSummary;

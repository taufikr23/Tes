import React from "react";

const ReportTable = ({ reports }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Laporan Harian</h3>
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Penjualan</p>
            <p className="text-2xl font-bold text-green-600">
              Rp {reports.total_penjualan?.toLocaleString("id-ID") || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Transaksi</p>
            <p className="text-2xl font-bold text-cyan-600">
              {reports.total_transaksi || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Konsultasi</p>
            <p className="text-2xl font-bold text-teal-600">
              {reports.total_konsultasi || 0}
            </p>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm mt-4">
          Laporan tanggal: {reports.tanggal}
        </p>
      </div>
    </div>
  );
};

export default ReportTable;

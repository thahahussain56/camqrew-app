import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { invoiceService, InvoiceRecord } from '../../services/invoiceService';
import {
  X,
  FileText,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Building2,
  Receipt,
} from 'lucide-react-native';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId?: string;
  orderId?: string;
  initialInvoice?: InvoiceRecord | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  bookingId,
  orderId,
  initialInvoice,
}) => {
  const { colors, isDark } = useTheme();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(initialInvoice || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialInvoice) {
        setInvoice(initialInvoice);
      } else if (bookingId) {
        loadBookingInvoice(bookingId);
      } else if (orderId) {
        loadOrderInvoice(orderId);
      }
    }
  }, [visible, bookingId, orderId, initialInvoice]);

  const loadBookingInvoice = async (bId: string) => {
    setLoading(true);
    setError(null);
    try {
      const inv = await invoiceService.createOrGetBookingInvoice(bId);
      setInvoice(inv);
    } catch (err: any) {
      console.warn('Error loading booking invoice:', err);
      setError(err.message || 'Could not load invoice.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderInvoice = async (oId: string) => {
    setLoading(true);
    setError(null);
    try {
      const inv = await invoiceService.createOrGetOrderInvoice(oId);
      setInvoice(inv);
    } catch (err: any) {
      console.warn('Error loading order invoice:', err);
      setError(err.message || 'Could not load invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    try {
      const issueDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const summary = `CAMQREW TAX INVOICE & ESCROW RECEIPT
Invoice No: ${invoice.invoice_number}
Date: ${issueDate}
Service: ${invoice.service_title}
Customer: ${invoice.customer_name}
Provider: ${invoice.creator_name || 'Camqrew Verified Network'}

--- FINANCIAL BREAKDOWN ---
Taxable Base Amount: ₹${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
CGST (9.0%): ₹${invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
SGST (9.0%): ₹${invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total GST (18.0%): ₹${(invoice.cgst + invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
TOTAL ESCROW PAID: ₹${invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

Status: 100% ESCROW PROTECTED (${invoice.escrow_status})
Payment Ref: ${invoice.payment_id}
GSTIN: 27AAACC4918P1Z3
Verified via Camqrew Technologies (www.camqrew.in)`;

      await Share.share({
        title: `Camqrew Tax Invoice - ${invoice.invoice_number}`,
        message: summary,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(63, 182, 104, 0.15)' }]}>
                <Receipt size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Tax Invoice & Escrow Receipt</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Permanently archived in your Camqrew account
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Retrieving official GST invoice...
              </Text>
            </View>
          ) : error || !invoice ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorTitle, { color: colors.danger }]}>Could not load invoice</Text>
              <Text style={[styles.errorSub, { color: colors.textSecondary }]}>{error || 'Invoice not found.'}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Invoice Meta Card */}
              <View style={[styles.invoiceMetaBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.invoiceMetaRow}>
                  <View>
                    <Text style={[styles.metaLabel, { color: colors.textFaint }]}>INVOICE NUMBER</Text>
                    <Text style={[styles.invoiceNumber, { color: colors.accent }]}>{invoice.invoice_number}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.statusBadgeText}>PAID IN ESCROW</Text>
                  </View>
                </View>

                <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

                <View style={styles.metaTwoCol}>
                  <View>
                    <Text style={[styles.metaLabel, { color: colors.textFaint }]}>ISSUE DATE</Text>
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                      {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View>
                    <Text style={[styles.metaLabel, { color: colors.textFaint }]}>ESCROW REF</Text>
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{invoice.payment_id}</Text>
                  </View>
                </View>
              </View>

              {/* Company & GSTIN Info */}
              <View style={[styles.companyCard, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.companyName, { color: colors.textPrimary }]}>
                  Camqrew Creative Technologies Pvt. Ltd.
                </Text>
                <Text style={[styles.companySub, { color: colors.textSecondary }]}>
                  GSTIN: 27AAACC4918P1Z3 • SAC: 998311 (Creative Media & Production)
                </Text>
                <Text style={[styles.companySub, { color: colors.textSecondary }]}>
                  Bandra West, Mumbai, MH - 400050 • billing@camqrew.in
                </Text>
              </View>

              {/* Billed To / Parties Card */}
              <View style={[styles.partiesCard, { borderColor: colors.border }]}>
                <View style={styles.partyColumn}>
                  <Text style={[styles.partyTitle, { color: colors.textFaint }]}>BILLED TO (CLIENT)</Text>
                  <Text style={[styles.partyName, { color: colors.textPrimary }]}>{invoice.customer_name}</Text>
                  {invoice.customer_phone ? (
                    <Text style={[styles.partySub, { color: colors.textSecondary }]}>📞 {invoice.customer_phone}</Text>
                  ) : null}
                  {invoice.customer_email ? (
                    <Text style={[styles.partySub, { color: colors.textSecondary }]}>✉️ {invoice.customer_email}</Text>
                  ) : null}
                </View>

                <View style={[styles.partyDivider, { backgroundColor: colors.border }]} />

                <View style={styles.partyColumn}>
                  <Text style={[styles.partyTitle, { color: colors.textFaint }]}>CREATOR / STUDIO</Text>
                  <Text style={[styles.partyName, { color: colors.textPrimary }]}>{invoice.creator_name || 'Camqrew Network'}</Text>
                  <Text style={[styles.partySub, { color: colors.textSecondary }]}>
                    Fulfillment: Escrow Milestone Release
                  </Text>
                </View>
              </View>

              {/* Service Line Item */}
              <View style={[styles.lineItemCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lineItemTitle, { color: colors.textPrimary }]}>{invoice.service_title}</Text>
                  <Text style={[styles.lineItemDesc, { color: colors.textSecondary }]}>
                    Advance & Milestone Escrow Locked Funds (SAC: 998311)
                  </Text>
                </View>
                <Text style={[styles.lineItemPrice, { color: colors.textPrimary }]}>
                  ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* 18% GST Breakdown Box */}
              <View style={[styles.calcBox, { borderColor: colors.border }]}>
                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Taxable Base Value</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>
                    ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>CGST (9.0%)</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>
                    ₹{invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>SGST (9.0%)</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>
                    ₹{invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Total GST (18.0%)</Text>
                  <Text style={[styles.calcVal, { color: colors.textPrimary }]}>
                    ₹{(invoice.cgst + invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={[styles.totalRow, { backgroundColor: 'rgba(63, 182, 104, 0.12)' }]}>
                  <View>
                    <Text style={[styles.totalLabel, { color: '#166534' }]}>TOTAL PAID IN ESCROW</Text>
                    <Text style={{ fontSize: 11, color: '#16a34a' }}>Inclusive of 18% GST</Text>
                  </View>
                  <Text style={[styles.totalAmount, { color: '#166534' }]}>
                    ₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Escrow Seal Banner */}
              <View style={styles.escrowSeal}>
                <ShieldCheck size={22} color="#166534" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sealTitle}>100% Escrow Protected • Status: {invoice.escrow_status}</Text>
                  <Text style={styles.sealDesc}>
                    Funds are safely preserved in the Camqrew Escrow Reserve and only released upon your explicit stage approval. This invoice is permanently accessible in your account.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Action */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={!invoice}>
              <Share2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.shareBtnText}>Share / Save Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.doneBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.doneBtnText, { color: colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  errorSub: {
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 24,
  },
  invoiceMetaBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '800',
  },
  metaDivider: {
    height: 1,
    marginVertical: 10,
  },
  metaTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  companyCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  companySub: {
    fontSize: 11,
    marginTop: 2,
  },
  partiesCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },
  partyColumn: {
    flex: 1,
  },
  partyDivider: {
    width: 1,
    marginHorizontal: 10,
  },
  partyTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
  },
  partySub: {
    fontSize: 11,
    marginTop: 2,
  },
  lineItemCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  lineItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  lineItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 10,
  },
  calcBox: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  calcLabel: {
    fontSize: 12,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  escrowSeal: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sealTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  sealDesc: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  shareBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

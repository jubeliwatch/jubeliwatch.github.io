/* =====================================================================
   Jubeliwatch settings (POS, repair status, receipts, journal).
   You can edit this file on GitHub; save, wait about 1 minute, and the site updates.

   There is no server: full records live in PRIVATE GitHub repos (repoData, repoBersama),
   and the customer-facing data on this site is encrypted (repoSitus).
   NEVER put a GitHub token in this file; tokens are entered on the POS page itself.
   ===================================================================== */
var JUBELI_LAYANAN = {
    situsUrl: 'https://jubeliwatch.github.io/',

    github: {
        pemilik: 'jubeliwatch',
        repoSitus: 'jubeliwatch.github.io',     /* this website (public) */
        repoData: 'jubeliwatch-owner-data',     /* PRIVATE, owner only: buybacks, consignments, ID cards, stock costs */
        repoBersama: 'jubeliwatch-shop-data',   /* PRIVATE, owner + staff: service, stock without costs, sales, journal */
        cabang: 'main'
    },

    toko: {
        nama: 'Jubeliwatch',
        alamat: 'Jln. Jabaru II, Bojong Baru, Pasirkuda, Kota Bogor',
        jam: 'Mon–Sun 12.00–19.00 (Friday from 13.00)',
        wa: '6285795738637',
        rekening: [
            { bank: 'BCA', nomor: '6395460912', atasNama: 'Rio Alam Nur' }
        ]
    },

    /* payment rule: work starts after the deposit on labour + parts paid in full */
    dpJasaPersen: 50,
    bulatkanKe: 1000,

    /* watch is done but not collected (counted from the day it is marked Done) */
    gratisTitipHari: 14,                   /* free storage for this many days */
    biayaTitipPerHari: 5000,               /* storage fee per day after that (Rp) */
    garansiHangusHari: 30,                 /* warranty is void if not collected within this many days */
    penyimpananLamaHari: 90,               /* after this, the owner is contacted in writing; the watch stays stored */
    pengingatHari: [7, 12],                /* the POS reminds you to send a WhatsApp on these days */

    /* warranty codes: '7h' = 7 days, '1b' = 1 month, '6b' = 6 months, '12b' = 1 year */
    syaratJatuh: 'Valid as long as the watch is not dropped, knocked, or exposed to water beyond its rating.',

    /* common service work (starting prices; can be changed per job). Price 0 = quote per job. */
    katalogJasa: [
        { grup: 'Battery & quick fixes', nama: 'Battery replacement (quartz)', harga: 0, garansi: '1b' },
        { grup: 'Battery & quick fixes', nama: 'Bracelet sizing / link adjustment', harga: 0, garansi: '' },
        { grup: 'Battery & quick fixes', nama: 'Strap fitting', harga: 0, garansi: '' },
        { grup: 'Battery & quick fixes', nama: 'Spring bar / buckle replacement', harga: 0, garansi: '7h' },
        { grup: 'Service', nama: 'Full service (automatic / manual)', harga: 0, garansi: '6b', jatuh: true },
        { grup: 'Service', nama: 'Full service (quartz)', harga: 0, garansi: '6b', jatuh: true },
        { grup: 'Service', nama: 'Regulation / timing adjustment', harga: 0, garansi: '1b', jatuh: true },
        { grup: 'Service', nama: 'Demagnetising', harga: 0, garansi: '7h' },
        { grup: 'Case & crystal', nama: 'Crystal replacement', harga: 0, garansi: '1b', jatuh: true },
        { grup: 'Case & crystal', nama: 'Crown / stem replacement', harga: 0, garansi: '1b' },
        { grup: 'Case & crystal', nama: 'Gasket replacement + water resistance test', harga: 0, garansi: '1b' },
        { grup: 'Case & crystal', nama: 'Case & bracelet polishing', harga: 0, garansi: '' },
        { grup: 'Repair', nama: 'Movement repair', harga: 0, garansi: '6b', jatuh: true },
        { grup: 'Repair', nama: 'Dial / hands repair', harga: 0, garansi: '1b', jatuh: true },
        { grup: 'Other', nama: 'Inspection & estimate', harga: 0, garansi: '' }
    ],

    /* movement types (service, stock, buyback, consignment forms) */
    jenisArloji: ['Automatic', 'Manual wind', 'Quartz', 'Solar / kinetic', 'Smartwatch', 'Other'],
    jenisTanpaArloji: [],
    /* condition grades for pre-owned watches (posters, collection, WhatsApp): key, label, short meaning shown in the POS */
    tingkatKondisi: [
        ['bnib', 'BNIB / Unworn', 'never used; original packaging, tags, factory films, and documents'],
        ['mint', 'Mint / LNIB', 'worn once or twice at most, no visible wear'],
        ['excellent', 'Excellent', 'very light signs of careful use; faint hairlines only under harsh light'],
        ['very_good', 'Very Good', 'normal careful wear, minor scratches or scuffs, no deep dings'],
        ['good', 'Good', 'obvious daily wear, noticeable scratches, minor dings, strap patina'],
        ['fair', 'Fair', 'heavy wear: deep scratches, dents, tired strap, or scratched crystal'],
        ['poor', 'Poor / For Parts', 'not working or badly damaged; for parts or full restoration']
    ],
    /* ---------- watch rental (pre-owned stock); hidden from the menu, kept for later ---------- */
    sewa: {
        tarifHarian: [[1, 100000], [2, 150000], [3, 175000]],
        tambahPerHari: 25000,
        tarifMinggu: 300000,
        batasUnitStandar: 2000000,
        depositPersen: 10,
        dendaSenar: 10000,
        senarCadangan: 6,
        toleransiHari: 1,
        maksHari: 30,
        /* printed in the WhatsApp message; {batas}, {tambah}, {deposit}, {jam} are filled in automatically */
        ketentuan: [
            'The watch is handed over in the condition shown in the handover notes/photos and must be returned in the same condition by {batas} at the latest.',
            'The rental fee and deposit ({deposit}) are paid upfront. The deposit is refunded in full when the watch comes back undamaged.',
            'Any damage or loss is repaired or replaced at cost, taken from the deposit; the renter pays any shortfall.',
            'One rental day = 24 hours from collection. Return the watch to the shop during opening hours: {jam}.',
            'There is a 24-hour grace period after the rental ends with no extra charge. After that, extra days are charged ({tambah} per day from day 4). Returning early does not reduce the fee.',
            'The watch may not be lent, sub-let, or used as security with anyone else.'
        ]
    },

    /* Stock menu & website collection: accessory categories, and when "only N left" is shown */
    kategoriAksesoris: ['Strap', 'Bracelet', 'Battery', 'Watch box & roll', 'Winder', 'Tools', 'Care', 'Parts', 'Other'],
    katalogSisaTampil: 3,

    /* printed on the service receipt; {dp}, {gratis}, {biaya}, {hangus}, {lepas} are filled in automatically */
    ketentuan: [
        'Work starts once we receive a {dp}% deposit on labour and full payment for parts.',
        'If we find other problems, the cost and timing may change; we will ask you before doing any extra work.',
        'The warranty starts when the watch is collected and covers only the work listed on this receipt.',
        'The warranty does not apply if the watch is opened or repaired by anyone else.',
        'Finished watches are stored free for {gratis} days after we let you know. After that, a storage fee of {biaya} applies. If not collected within {hangus} days, the service warranty is void.',
        'If a watch is not collected within {lepas} days of being finished, we will contact the owner in writing (WhatsApp). We keep it safely stored and the storage fee continues. Changes caused by long storage (for example a drained battery or ageing lubricants) are not covered by the service warranty.',
        'Warranty claims require quoting the service code or showing this receipt.'
    ],

    /* ---------- buy with a right to buy back (sale with repurchase right, Indonesian Civil Code art. 1519 ff.) ----------
       The shop BUYS the watch; the seller may buy it back until the deadline for the SAME price.
       Shop policy: no extra fees. Adding monthly "interest" would turn it into an interest-bearing loan. */
    tebus: {
        batasHari: 30,
        maksHari: 90,
        pengingatHari: [7, 1],
        fotoKtpMinHarga: 1000000,
        hapusKtpHari: 90,
        /* printed on the agreement; {batas}, {tebus} are filled in automatically */
        ketentuan: [
            'The seller confirms this watch is their own property, not stolen, pledged, or disputed, and transfers ownership to Jubeliwatch for the purchase price stated.',
            'The seller has the right to buy this watch back no later than {batas} for {tebus}.',
            'During this period the shop keeps the watch safely and does not sell it to anyone else.',
            'If the seller has not bought it back by {batas}, the buyback right ends and the watch belongs fully to the shop, with no other obligations between the parties.',
            'The deadline can only be changed if both parties agree in writing (WhatsApp).'
        ]
    },

    /* ---------- selling stock with a deposit, then the balance ----------
       The cancellation fee is a fair deduction agreed upfront (the buyer replies AGREE on WhatsApp).
       A "deposit is forfeited / non-refundable" clause is deliberately not used (Law 8/1999 art. 18). */
    jual: {
        batasHari: 30,
        potonganPersen: 10,
        pengingatHari: [7, 1],
        /* printed on the order receipt; {batas}, {potongan} are filled in automatically */
        ketentuan: [
            'The item is held for the buyer until {batas} and will not be sold to anyone else in that time.',
            'The balance must be paid by {batas}. The item is handed over once paid in full.',
            'If the buyer cancels, or has not paid in full by {batas} without a new agreement, the order is cancelled and the money paid is refunded minus a cancellation fee of {potongan}% of the item price (no more than the amount paid).',
            'If the shop cancels (for example the item is damaged or cannot be delivered), everything is refunded with no deduction.',
            'Payment is only valid in cash at the shop or by transfer to the account on this receipt. The deadline can be changed if both parties agree in writing (WhatsApp).'
        ]
    },

    /* ---------- consignment: the owner leaves a watch, the shop sells it and takes a commission ----------
       The commission is copied onto each consignment when created (can be changed per owner): 15% of the actual
       selling price, at least Rp150.000, and 10% above Rp10.000.000. Liability is limited to the shop's negligence. */
    titip: {
        komisiPersen: 15,
        komisiMin: 150000,
        batasMahal: 10000000,
        persenMahal: 10,
        tinjauHari: 60,
        /* printed on the consignment terms & WhatsApp; {harga}, {min}, {komisi}, {tinjau} are filled in automatically */
        ketentuan: [
            'The owner confirms this watch is their own property, not stolen, pledged, or disputed, and leaves it with Jubeliwatch to sell.',
            'The agreed selling price is {harga}. The price only changes with the owner’s approval (WhatsApp), and the shop never sells below the minimum price of {min}.',
            'Shop commission: {komisi}. The proceeds after commission belong to the owner.',
            'The owner is paid after the watch sells and the buyer has paid in full.',
            'There is no time limit. Every {tinjau} days the shop contacts the owner to review the price. The owner may take the watch back at any time, free of charge, with notice.',
            'The shop stores the watch safely. If it is damaged or lost through the shop’s negligence (for example dropped, lost, or stolen from the shop), the shop pays the minimum price of {min}.',
            'Faults not caused by storage (for example a movement or battery failing on its own) and flaws already present on arrival (as shown in the condition photos) are not the shop’s responsibility.',
            'Changes to this agreement apply when both parties agree in writing (WhatsApp).'
        ]
    }
};

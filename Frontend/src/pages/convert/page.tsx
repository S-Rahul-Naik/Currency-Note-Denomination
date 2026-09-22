import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRightLeft,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/base/PageHeader";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { useApp } from "@/context/AppProvider";
import { useVoice } from "@/context/VoiceProvider";
import {
  SUPPORTED_CURRENCIES,
  getCurrency,
  formatAmount,
} from "@/constants/currencies";
import { convert, convertLive, speakConversion, type ConversionResult } from "@/services/converter/convertService";

export default function Convert() {
  const [searchParams] = useSearchParams();
  const { preferences, updatePreferences } = useApp();
  const { speakResult } = useVoice();

  const [fromCode, setFromCode] = useState<string>(searchParams.get("from") ?? preferences.detectionCurrency);
  const [toCode, setToCode] = useState<string>(preferences.conversionCurrency);
  const [amount, setAmount] = useState<string>(searchParams.get("amount") ?? "100");

  const from = getCurrency(fromCode);
  const to = getCurrency(toCode);
  const numericAmount = parseFloat(amount) || 0;

  const [result, setResult] = useState<ConversionResult>(() => convert({ from, amount: numericAmount, to }));

  useEffect(() => {
    let cancelled = false;
    void convertLive({ from, amount: numericAmount, to }).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => { cancelled = true; };
  }, [from, numericAmount, to]);

  const sourceLabel =
    result.source === "online"
      ? "Online"
      : result.source === "cached"
        ? "Cached"
        : "Offline";

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const handleSpeak = () => {
    speakResult(
      speakConversion(from, numericAmount, to, result.amount),
      "confirmation",
    );
  };

  return (
    <MainLayout>
      <PageHeader title="Currency Converter" subtitle="Convert amounts between supported currencies." />

      <div className="px-5 py-6 md:px-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <Card label="Convert amount">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="amount" className="mb-1.5 block text-sm font-semibold text-foreground-900">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Amount to convert"
                className="h-16 w-full rounded-xl border border-background-300 bg-background-50 px-4 text-3xl font-bold text-foreground-950 focus:border-primary-400 focus:outline-3 focus:outline-primary-400"
              />
            </div>
            <span aria-hidden="true" className="pb-3 text-3xl">{from.flag}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CurrencySelect id="from" label="From" value={fromCode} onChange={setFromCode} />
            <CurrencySelect id="to" label="To" value={toCode} onChange={setToCode} />
          </div>

          <button
            onClick={swap}
            aria-label="Swap currencies"
            className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary-100 py-3 text-secondary-800 transition-colors hover:bg-secondary-200"
          >
            <ArrowRightLeft aria-hidden="true" className="h-4 w-4" />
            <span className="text-sm font-bold">Swap</span>
          </button>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-background-100 px-4 py-3">
            <span className="text-xs text-foreground-600">Exchange rate</span>
            <span className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  result.source === "online"
                    ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
                    : "bg-background-50 text-foreground-600 ring-1 ring-background-200"
                }`}
              >
                {result.source === "online" ? (
                  <Wifi aria-hidden="true" className="h-3 w-3" />
                ) : (
                  <WifiOff aria-hidden="true" className="h-3 w-3" />
                )}
                {sourceLabel}
              </span>
              <span className="text-sm font-bold text-foreground-950">
                1 {from.code} = {result.rate.toFixed(4)} {to.code}
              </span>
            </span>
          </div>
        </Card>

        <div className="mt-5 lg:mt-0">
          <Card className="flex flex-col items-center py-8 text-center">
            <p className="text-xs uppercase tracking-wider text-foreground-600">Converted amount</p>
            <p className="mt-2 font-heading text-5xl font-bold text-foreground-950">
              {formatAmount(toCode, result.amount)}
            </p>
            <p className="mt-2 text-sm font-semibold text-primary-700">
              {numericAmount} {from.code} → {result.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {to.code}
            </p>

            <Button
              className="mt-6"
              size="lg"
              fullWidth
              onClick={handleSpeak}
              icon={<Volume2 aria-hidden="true" className="h-5 w-5" />}
            >
              Speak Result
            </Button>

            <button
              onClick={() => updatePreferences({ conversionCurrency: toCode as never })}
              className="mt-3 w-full cursor-pointer rounded-xl border border-background-300 px-4 py-3 text-sm font-bold text-primary-700 transition-colors hover:bg-background-100"
            >
              Set {to.code} as default conversion currency
            </button>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

interface CurrencySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function CurrencySelect({ id, label, value, onChange }: CurrencySelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground-900">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full cursor-pointer rounded-xl border border-background-300 bg-background-50 px-3 text-sm font-bold text-foreground-950 focus:border-primary-400 focus:outline-3 focus:outline-primary-400"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code} — {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
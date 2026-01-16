import { useState, useEffect } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-dark.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, FileText, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEOSettings, CategorySEOContent, FAQItem, PRODUCT_CATEGORIES, ProductCategory } from "@/types/seo-settings";

interface CategorySEOEditorProps {
  settings: SEOSettings;
  onUpdate: (updates: Partial<SEOSettings>) => Promise<void>;
  onReload: () => Promise<void>;
}

const CategorySEOEditor = ({ settings, onUpdate, onReload }: CategorySEOEditorProps) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [categoryData, setCategoryData] = useState<CategorySEOContent>({
    meta_title_template: '',
    meta_description_template: '',
    heading: '',
    description: '',
    faq: [],
    pinterest_board: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadCategoryData(selectedCategory);
  }, [selectedCategory, settings]);

  const loadCategoryData = (category: ProductCategory) => {
    const categoryContent = settings.category_seo_content?.[category];
    
    if (categoryContent) {
      setCategoryData(categoryContent);
    } else {
      // Empty template if category not yet configured
      setCategoryData({
        meta_title_template: '',
        meta_description_template: '',
        heading: '',
        description: '',
        faq: [],
        pinterest_board: ''
      });
    }
    setHasUnsavedChanges(false);
  };

  const handleFieldChange = (field: keyof CategorySEOContent, value: string) => {
    setCategoryData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const addFAQEntry = () => {
    setCategoryData(prev => ({
      ...prev,
      faq: [...prev.faq, { question: '', answer: '' }]
    }));
    setHasUnsavedChanges(true);
  };

  const updateFAQEntry = (index: number, field: keyof FAQItem, value: string) => {
    setCategoryData(prev => {
      const newFaq = [...prev.faq];
      newFaq[index] = { ...newFaq[index], [field]: value };
      return { ...prev, faq: newFaq };
    });
    setHasUnsavedChanges(true);
  };

  const removeFAQEntry = (index: number) => {
    setCategoryData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  const saveCategoryData = async () => {
    try {
      setIsSaving(true);

      // Update the JSONB object
      const updatedContent = {
        ...settings.category_seo_content,
        [selectedCategory]: categoryData
      };

      await onUpdate({ category_seo_content: updatedContent });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving category data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetCategoryData = () => {
    loadCategoryData(selectedCategory);
    toast({
      title: "Zurückgesetzt",
      description: "Änderungen wurden verworfen",
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <label className="block text-sm font-medium mb-2">Kategorie wählen</label>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ProductCategory)}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {PRODUCT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat} className="text-white">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Form Fields */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
        {/* Meta Title Template */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Meta Title Template
            <span className="text-gray-400 text-xs ml-2">
              Verwendet für {'<title>'} Tag
            </span>
          </label>
          <Input
            value={categoryData.meta_title_template}
            onChange={(e) => handleFieldChange('meta_title_template', e.target.value)}
            placeholder="{category} in {city} - Kundenbewertung {rating}/5 | Der Kamindoktor"
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Verfügbare Variablen: {'{category}'}, {'{city}'}, {'{postal_code}'}, {'{rating}'}, {'{customer_lastname}'}
          </p>
        </div>

        {/* Meta Description Template */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Meta Description Template
          </label>
          <Textarea
            value={categoryData.meta_description_template}
            onChange={(e) => handleFieldChange('meta_description_template', e.target.value)}
            placeholder="{customer_salutation} {customer_lastname} aus {city} bewertet..."
            rows={3}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Max. 160 Zeichen empfohlen
          </p>
        </div>

        {/* Heading (H2) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Überschrift (H2)
          </label>
          <Input
            value={categoryData.heading}
            onChange={(e) => handleFieldChange('heading', e.target.value)}
            placeholder="Professionelle {category}-Installation in {city}"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Description (HTML) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Beschreibungstext (HTML)
            <span className="text-gray-400 text-xs ml-2">
              400-600 Wörter empfohlen
            </span>
          </label>
          
          <div className="quill-dark-wrapper">
            <ReactQuill
              theme="snow"
              value={categoryData.description}
              onChange={(content) => handleFieldChange('description', content)}
              placeholder="Ein <strong>{category}</strong> ist die ideale Lösung für..."
              className="bg-gray-800 text-white rounded-lg"
              modules={{
                toolbar: [
                  [{ 'header': [2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline',
                'list', 'bullet',
                'link'
              ]}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            Verwenden Sie HTML-Tags. Verfügbare Variablen: <code className="text-orange-400">{'{category}'}</code>, <code className="text-orange-400">{'{city}'}</code>, <code className="text-orange-400">{'{postal_code}'}</code>, <code className="text-orange-400">{'{region}'}</code>
          </p>
          
          {/* Variable Helper Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentContent = categoryData.description;
                handleFieldChange('description', currentContent + '{category}');
              }}
              className="text-xs"
            >
              + {'{category}'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentContent = categoryData.description;
                handleFieldChange('description', currentContent + '{city}');
              }}
              className="text-xs"
            >
              + {'{city}'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentContent = categoryData.description;
                handleFieldChange('description', currentContent + '{postal_code}');
              }}
              className="text-xs"
            >
              + {'{postal_code}'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const currentContent = categoryData.description;
                handleFieldChange('description', currentContent + '{region}');
              }}
              className="text-xs"
            >
              + {'{region}'}
            </Button>
        </div>

        {/* Pinterest Board */}
        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium mb-2">
            🔗 Pinterest Board URL
            <span className="text-gray-400 text-xs ml-2">
              Für automatisches Pinnen dieser Kategorie
            </span>
          </label>
          <Input
            value={categoryData.pinterest_board || ''}
            onChange={(e) => handleFieldChange('pinterest_board', e.target.value)}
            placeholder="https://pinterest.com/kamindoktor/kaminoefen/"
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: https://pinterest.com/benutzername/pinwand-name/
          </p>
        </div>
      </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">FAQ-Einträge</h3>
          <Button onClick={addFAQEntry} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            FAQ hinzufügen
          </Button>
        </div>

        {categoryData.faq.length > 0 ? (
          <div className="space-y-4">
            {categoryData.faq.map((faq, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-400">FAQ #{index + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFAQEntry(index)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Frage</label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFAQEntry(index, 'question', e.target.value)}
                      placeholder="Was kostet ein {category} in {city}?"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Antwort</label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => updateFAQEntry(index, 'answer', e.target.value)}
                      placeholder="Die Kosten für einen {category} in {city} variieren..."
                      rows={4}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-lg">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-3">Noch keine FAQ-Einträge vorhanden</p>
            <Button onClick={addFAQEntry} variant="outline">
              Ersten FAQ-Eintrag erstellen
            </Button>
          </div>
        )}
      </div>

      {/* Save Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-800">
        <Button 
          onClick={saveCategoryData} 
          disabled={!hasUnsavedChanges || isSaving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSaving ? "Wird gespeichert..." : "💾 Änderungen speichern"}
        </Button>
        <Button 
          variant="outline" 
          onClick={resetCategoryData}
          disabled={!hasUnsavedChanges || isSaving}
          className="border-gray-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Zurücksetzen
        </Button>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-sm text-yellow-500">
            ⚠️ Sie haben ungespeicherte Änderungen
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySEOEditor;

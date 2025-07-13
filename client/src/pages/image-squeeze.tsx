import { useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, Download, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageFile {
  file: File;
  preview: string;
  optimized?: {
    blob: Blob;
    preview: string;
    size: number;
    compression: number;
  };
}

export default function ImageSqueeze() {
  const { toast } = useToast();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState([80]);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState("keep");
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = useCallback((files: FileList) => {
    let newImages: ImageFile[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newImages = [...newImages, { file, preview }];
      }
    });

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const compressImage = async (image: ImageFile): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        const outputFormat = format === 'keep' ? image.file.type : `image/${format}`;
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, outputFormat, quality[0] / 100);
      };
      
      img.src = image.preview;
    });
  };

  const optimizeImages = async () => {
    if (images.length === 0) {
      toast({
        title: "No images",
        description: "Please upload some images first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    
    try {
      const optimizedImages = await Promise.all(
        images.map(async (image) => {
          const optimizedBlob = await compressImage(image);
          const optimizedPreview = URL.createObjectURL(optimizedBlob);
          const compression = Math.round((1 - optimizedBlob.size / image.file.size) * 100);
          
          return {
            ...image,
            optimized: {
              blob: optimizedBlob,
              preview: optimizedPreview,
              size: optimizedBlob.size,
              compression
            }
          };
        })
      );
      
      setImages(optimizedImages);
      toast({
        title: "Images optimized",
        description: `${optimizedImages.length} images have been optimized`
      });
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Failed to optimize images",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (image: ImageFile) => {
    if (!image.optimized) return;
    
    const url = URL.createObjectURL(image.optimized.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-${image.file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    images.forEach(image => {
      if (image.optimized) {
        downloadImage(image);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Header 
        title="ImageSqueeze - Image Optimizer" 
        subtitle="Compress and optimize images"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Image Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag and drop your images here, or click to select
                </p>
                <Button onClick={() => document.getElementById('file-input')?.click()}>
                  Choose Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Optimization Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      max={100}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <span className="font-mono text-sm w-12">{quality[0]}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-width">Max Width</Label>
                  <Input
                    id="max-width"
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    min={100}
                    max={4000}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep Original</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button onClick={optimizeImages} disabled={processing || images.length === 0}>
                  {processing ? "Processing..." : "Optimize Images"}
                </Button>
                <Button variant="outline" onClick={downloadAll} disabled={!images.some(img => img.optimized)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              {images.map((image, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium">{image.file.name}</h3>
                      <Button variant="ghost" size="sm" onClick={() => removeImage(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Original */}
                      <div>
                        <h4 className="font-medium mb-2">Original</h4>
                        <div className="bg-muted rounded border p-4 mb-4">
                          <img
                            src={image.preview}
                            alt="Original"
                            className="w-full h-48 object-contain rounded"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-muted rounded p-2">
                            <div className="text-muted-foreground">Size</div>
                            <div className="font-mono">{formatBytes(image.file.size)}</div>
                          </div>
                          <div className="bg-muted rounded p-2">
                            <div className="text-muted-foreground">Type</div>
                            <div className="font-mono">{image.file.type}</div>
                          </div>
                          <div className="bg-muted rounded p-2">
                            <div className="text-muted-foreground">Status</div>
                            <div className="font-mono">Original</div>
                          </div>
                        </div>
                      </div>

                      {/* Optimized */}
                      <div>
                        <h4 className="font-medium mb-2">Optimized</h4>
                        {image.optimized ? (
                          <>
                            <div className="bg-muted rounded border p-4 mb-4">
                              <img
                                src={image.optimized.preview}
                                alt="Optimized"
                                className="w-full h-48 object-contain rounded"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                              <div className="bg-muted rounded p-2">
                                <div className="text-muted-foreground">Size</div>
                                <div className="font-mono">{formatBytes(image.optimized.size)}</div>
                              </div>
                              <div className="bg-muted rounded p-2">
                                <div className="text-muted-foreground">Saved</div>
                                <div className="font-mono text-green-600">{image.optimized.compression}%</div>
                              </div>
                              <div className="bg-muted rounded p-2">
                                <div className="text-muted-foreground">Status</div>
                                <div className="font-mono">Ready</div>
                              </div>
                            </div>
                            <Button onClick={() => downloadImage(image)} className="w-full">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </>
                        ) : (
                          <div className="bg-muted rounded border p-4 mb-4 flex items-center justify-center h-48">
                            <p className="text-muted-foreground">Click "Optimize Images" to process</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

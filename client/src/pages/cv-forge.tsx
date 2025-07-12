import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download, Eye, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  template: 'modern' | 'classic' | 'minimal';
}

export default function CVForge() {
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      linkedin: "",
      github: "",
      website: "",
      summary: ""
    },
    experience: [],
    education: [],
    skills: [],
    template: 'modern'
  });
  const [newSkill, setNewSkill] = useState("");
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: ""
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const generatePDF = async () => {
    // In a real implementation, you would use jsPDF here
    // For now, we'll simulate PDF generation
    try {
      const resumeText = `
${resumeData.personalInfo.fullName}
${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone}
${resumeData.personalInfo.address}

PROFESSIONAL SUMMARY
${resumeData.personalInfo.summary}

EXPERIENCE
${resumeData.experience.map(exp => `
${exp.position} at ${exp.company}
${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}
${exp.description}
`).join('\n')}

EDUCATION
${resumeData.education.map(edu => `
${edu.degree} in ${edu.field}
${edu.institution} (${edu.startDate} - ${edu.endDate})
${edu.gpa ? `GPA: ${edu.gpa}` : ''}
`).join('\n')}

SKILLS
${resumeData.skills.join(', ')}
      `.trim();

      const blob = new Blob([resumeText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Resume generated",
        description: "Your resume has been downloaded as a text file"
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate resume",
        variant: "destructive"
      });
    }
  };

  const saveResume = () => {
    localStorage.setItem('devtoolnest-resume', JSON.stringify(resumeData));
    toast({
      title: "Resume saved",
      description: "Your resume has been saved locally"
    });
  };

  return (
    <>
      <Header 
        title="CVForge - Resume Builder" 
        subtitle="Create professional resumes"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={resumeData.template} onValueChange={(value: any) => setResumeData(prev => ({ ...prev, template: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Navigation Tabs */}
              <Card>
                <CardHeader>
                  <div className="flex gap-2 flex-wrap">
                    {(['personal', 'experience', 'education', 'skills'] as const).map(tab => (
                      <Button
                        key={tab}
                        variant={activeTab === tab ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Personal Information */}
                  {activeTab === 'personal' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, email: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, phone: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={resumeData.personalInfo.address}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, address: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            value={resumeData.personalInfo.github}
                            onChange={(e) => setResumeData(prev => ({
                              ...prev,
                              personalInfo: { ...prev.personalInfo, github: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={resumeData.personalInfo.website}
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, website: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          rows={4}
                          value={resumeData.personalInfo.summary}
                          onChange={(e) => setResumeData(prev => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, summary: e.target.value }
                          }))}
                          placeholder="Brief overview of your professional background..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {activeTab === 'experience' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Work Experience</h3>
                        <Button onClick={addExperience}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      {resumeData.experience.map((exp, index) => (
                        <Card key={exp.id} className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Experience {index + 1}</h4>
                            <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Position</Label>
                              <Input
                                value={exp.position}
                                onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                type="date"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                              />
                              <span className="text-sm">Currently working here</span>
                            </label>
                          </div>
                          <div className="mt-4">
                            <Label>Description</Label>
                            <Textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                        </Card>
                      ))}
                      {resumeData.experience.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No work experience added yet. Click "Add Experience" to get started.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Education */}
                  {activeTab === 'education' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Education</h3>
                        <Button onClick={addEducation}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                      {resumeData.education.map((edu, index) => (
                        <Card key={edu.id} className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Education {index + 1}</h4>
                            <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Field of Study</Label>
                              <Input
                                value={edu.field}
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>GPA (Optional)</Label>
                              <Input
                                value={edu.gpa}
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                type="date"
                                value={edu.startDate}
                                onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                type="date"
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                      {resumeData.education.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No education added yet. Click "Add Education" to get started.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {activeTab === 'skills' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newSkill">Add Skill</Label>
                        <div className="flex gap-2">
                          <Input
                            id="newSkill"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="e.g., JavaScript, React, Node.js"
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          />
                          <Button onClick={addSkill}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {skill}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-auto p-0"
                              onClick={() => removeSkill(skill)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      {resumeData.skills.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No skills added yet. Add your technical and soft skills above.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={generatePDF} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </Button>
                  <Button variant="outline" onClick={saveResume} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Resume
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-4 max-h-96 overflow-y-auto">
                    {/* Personal Info Preview */}
                    <div className="text-center">
                      <h2 className="text-lg font-bold">{resumeData.personalInfo.fullName || 'Your Name'}</h2>
                      <p className="text-muted-foreground">
                        {resumeData.personalInfo.email} | {resumeData.personalInfo.phone}
                      </p>
                      <p className="text-muted-foreground">{resumeData.personalInfo.address}</p>
                    </div>

                    {resumeData.personalInfo.summary && (
                      <div>
                        <h3 className="font-semibold mb-2">PROFESSIONAL SUMMARY</h3>
                        <p className="text-sm">{resumeData.personalInfo.summary}</p>
                      </div>
                    )}

                    {resumeData.experience.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">EXPERIENCE</h3>
                        <div className="space-y-3">
                          {resumeData.experience.map((exp) => (
                            <div key={exp.id}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{exp.position}</p>
                                  <p className="text-muted-foreground">{exp.company}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </p>
                              </div>
                              {exp.description && (
                                <p className="text-sm mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.education.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">EDUCATION</h3>
                        <div className="space-y-2">
                          {resumeData.education.map((edu) => (
                            <div key={edu.id}>
                              <p className="font-medium">{edu.degree} in {edu.field}</p>
                              <p className="text-muted-foreground">{edu.institution}</p>
                              <p className="text-xs text-muted-foreground">
                                {edu.startDate} - {edu.endDate}
                                {edu.gpa && ` | GPA: ${edu.gpa}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">SKILLS</h3>
                        <p className="text-sm">{resumeData.skills.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
